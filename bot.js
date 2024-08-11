const express = require('express');
const crypto = require('crypto');
const fs = require('fs').promises;
const { Telegraf, Markup } = require('telegraf');
const schedule = require('node-schedule');
const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN || '7224059617:AAGjAWXTSraaG1VKNTD9e-OPNATWL_P2RAA';
const bot = new Telegraf(BOT_TOKEN);

let raidSettings = {
  interval: 30, // minutes
  message: "🚀 Exciting project alert! 🚀\n\n💥 Don't miss out on the hottest crypto opportunity! 💥\n\n🔥 Join us now: https://t.me/yourprojectchannel",
  targetChannels: ['@channel1', '@channel2', '@channel3']
};
let raidStats = {
  totalRaids: 0,
  activeParticipants: 0,
  messagesPosted: 0
};
let leaderboard = {};
let isRaidActive = false;
let raidJob;

// Helper function to check if a user is whitelisted
async function isWhitelisted(userId) {
  const whitelistPath = './whitelist.txt';
  const whitelist = await fs.readFile(whitelistPath, 'utf8');
  return whitelist.split('\n').some(line => line.startsWith(userId + ','));
}

// Raid logic
async function conductRaid() {
  if (!isRaidActive) return;

  raidStats.totalRaids++;
  const messageWithButtons = Markup.inlineKeyboard([
    Markup.button.url('🔗 Join Now!', 'https://t.me/yourprojectchannel'),
    Markup.button.callback('ℹ️ Learn More', 'learn_more')
  ]);

  for (const channel of raidSettings.targetChannels) {
    try {
      await bot.telegram.sendMessage(channel, raidSettings.message, messageWithButtons);
      raidStats.messagesPosted++;
    } catch (error) {
      console.error(`Failed to send message to ${channel}:`, error);
    }
  }
}

// Route to handle Telegram authorization
router.post('/authorize', async (req, res) => {
  const authData = req.body;
  if (verifyTelegramAuth(authData)) {
    try {
      await whitelistUser(authData);
      res.json({ success: true, user: authData });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error whitelisting user' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Invalid authorization data' });
  }
});

// Function to verify Telegram authorization
function verifyTelegramAuth(authData) {
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const dataCheckString = Object.keys(authData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');
  const hash = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
  return hash === authData.hash && (Date.now() / 1000 - authData.auth_date < 86400);
}

// Function to whitelist a user
async function whitelistUser(userData) {
  const whitelistPath = './whitelist.txt';
  const userEntry = `${userData.id},${userData.username},${userData.first_name},${userData.last_name}\n`;
  try {
    await fs.appendFile(whitelistPath, userEntry);
  } catch (error) {
    console.error('Error writing to whitelist:', error);
    throw error;
  }
}

// Help command
bot.command('help', async (ctx) => {
  const helpMessage = `
🤖 *Shill Raid Bot Commands* 🤖

/start - Start the bot
/help - Show this help message
/settings - Update bot settings
/startraid - Start a shill raid
/stopraid - Stop the current raid
/stats - View raid statistics
/leaderboard - View top contributors
/participate - Join the current raid

For admin commands, you need to be whitelisted.
`;
  await ctx.replyWithMarkdown(helpMessage, Markup.keyboard([
    ['🚀 Start Raid', '🛑 Stop Raid'],
    ['📊 Stats', '🏆 Leaderboard'],
    ['⚙️ Settings', '🆘 Help']
  ]).resize());
});

// Start command
bot.command('start', async (ctx) => {
  const welcomeMessage = `
Welcome to the Shill Raid Bot! 🎉

This bot helps organize and execute promotional campaigns for your project. Use /help to see available commands.

Let's get started! 🚀
`;
  await ctx.reply(welcomeMessage, Markup.keyboard([
    ['🚀 Start Raid', '🛑 Stop Raid'],
    ['📊 Stats', '🏆 Leaderboard'],
    ['⚙️ Settings', '🆘 Help']
  ]).resize());
});

// Settings command
bot.command('settings', async (ctx) => {
  if (await isWhitelisted(ctx.from.id)) {
    await ctx.reply('⚙️ Current Settings:', Markup.inlineKeyboard([
      [Markup.button.callback('📝 Edit Message', 'edit_message')],
      [Markup.button.callback('⏱️ Change Interval', 'change_interval')],
      [Markup.button.callback('🎯 Manage Targets', 'manage_targets')]
    ]));
  } else {
    await ctx.reply('⛔ You are not authorized to change settings.');
  }
});

// Start raid command
bot.command('startraid', async (ctx) => {
  if (await isWhitelisted(ctx.from.id)) {
    if (!isRaidActive) {
      isRaidActive = true;
      raidJob = schedule.scheduleJob(`*/${raidSettings.interval} * * * *`, conductRaid);
      conductRaid(); // Start immediately
      await ctx.reply('🚀 Raid started! Shill messages will be sent every ' + raidSettings.interval + ' minutes.');
    } else {
      await ctx.reply('⚠️ A raid is already in progress.');
    }
  } else {
    await ctx.reply('⛔ You are not authorized to start raids.');
  }
});

// Stop raid command
bot.command('stopraid', async (ctx) => {
  if (await isWhitelisted(ctx.from.id)) {
    if (isRaidActive) {
      isRaidActive = false;
      if (raidJob) {
        raidJob.cancel();
      }
      await ctx.reply('🛑 Raid stopped. All scheduled messages have been cancelled.');
    } else {
      await ctx.reply('⚠️ There is no active raid to stop.');
    }
  } else {
    await ctx.reply('⛔ You are not authorized to stop raids.');
  }
});

// Stats command
bot.command('stats', async (ctx) => {
  const statsMessage = `
📊 *Raid Statistics* 📊

🔢 Total Raids: ${raidStats.totalRaids}
👥 Active Participants: ${raidStats.activeParticipants}
💬 Messages Posted: ${raidStats.messagesPosted}

Keep up the great work! 💪
`;
  await ctx.replyWithMarkdown(statsMessage);
});

// Leaderboard command
bot.command('leaderboard', async (ctx) => {
  const sortedLeaderboard = Object.entries(leaderboard)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  let leaderboardMessage = '🏆 *Top Shillers Leaderboard* 🏆\n\n';
  sortedLeaderboard.forEach(([userId, score], index) => {
    leaderboardMessage += `${index + 1}. User${userId}: ${score} contributions\n`;
  });
  
  leaderboardMessage += '\nKeep shilling to climb the ranks! 🚀';
  await ctx.replyWithMarkdown(leaderboardMessage);
});

// Participate command
bot.command('participate', async (ctx) => {
  if (isRaidActive) {
    const userId = ctx.from.id;
    try {
      await bot.telegram.sendMessage(raidSettings.targetChannels[0], raidSettings.message, 
        Markup.inlineKeyboard([
          Markup.button.url('🔗 Join Now!', 'https://t.me/yourprojectchannel'),
          Markup.button.callback('ℹ️ Learn More', 'learn_more')
        ])
      );
      raidStats.activeParticipants++;
      raidStats.messagesPosted++;
      leaderboard[userId] = (leaderboard[userId] || 0) + 1;
      await ctx.reply('🎉 Great job! Your shill message has been sent. Keep up the good work!');
    } catch (error) {
      await ctx.reply('😕 Oops! There was an error sending your shill message. Please try again later.');
    }
  } else {
    await ctx.reply('⚠️ There is no active raid to participate in right now. Wait for the next raid to start!');
  }
});

// Handle 'Learn More' button clicks
bot.action('learn_more', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Our project is revolutionizing the crypto space! 🚀💎\n\nKey Features:\n✅ Innovative blockchain solution\n✅ Strong community focus\n✅ Experienced team\n\nCheck out our website for more details: https://yourproject.com');
});

// Settings callbacks
bot.action('edit_message', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Please enter the new shill message:');
  // You'd need to implement a way to capture the next message from this user and update raidSettings.message
});

bot.action('change_interval', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Please enter the new interval in minutes:');
  // You'd need to implement a way to capture the next message from this user and update raidSettings.interval
});

bot.action('manage_targets', async (ctx) => {
  await ctx.answerCbQuery();
  let targetMessage = '🎯 Current target channels:\n\n';
  raidSettings.targetChannels.forEach((channel, index) => {
    targetMessage += `${index + 1}. ${channel}\n`;
  });
  targetMessage += '\nTo add or remove targets, use /addtarget or /removetarget followed by the channel username.';
  await ctx.reply(targetMessage);
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
});

// Function to start the bot
function startBot() {
    return bot.launch();
  }
  
  // Error handling
  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
  });
  
  module.exports = {
    router,
    startBot
  };