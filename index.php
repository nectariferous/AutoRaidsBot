<?php
session_start();
define('BOT_USERNAME', '@AutoRaidsBot');
define('BOT_TOKEN', getenv('BOT_TOKEN'));

function checkTelegramAuthorization($auth_data) {
    $check_hash = $auth_data['hash'];
    unset($auth_data['hash']);
    $data_check_arr = [];
    foreach ($auth_data as $key => $value) {
        $data_check_arr[] = $key . '=' . $value;
    }
    sort($data_check_arr);
    $data_check_string = implode("\n", $data_check_arr);
    $secret_key = hash('sha256', BOT_TOKEN, true);
    $hash = hash_hmac('sha256', $data_check_string, $secret_key);
    if (strcmp($hash, $check_hash) !== 0) {
        throw new Exception('Data is NOT from Telegram');
    }
    if ((time() - $auth_data['auth_date']) > 86400) {
        throw new Exception('Data is outdated');
    }
    return $auth_data;
}

function saveTelegramUserData($auth_data) {
    $_SESSION['tg_user'] = $auth_data;
}

function getTelegramUserData() {
    return $_SESSION['tg_user'] ?? false;
}

function isWhitelisted($user_id) {
    // In a real application, you would check against a database
    // For this example, we'll use a session variable
    return isset($_SESSION['whitelisted_users'][$user_id]);
}

function addToWhitelist($user_id) {
    // In a real application, you would add to a database
    // For this example, we'll use a session variable
    $_SESSION['whitelisted_users'][$user_id] = true;
}

function getTotalWhitelistedUsers() {
    // In a real application, you would count from a database
    // For this example, we'll use a session variable
    return count($_SESSION['whitelisted_users'] ?? []);
}

$auth_data = null;
$is_whitelisted = false;

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}

if (isset($_GET['hash'])) {
    try {
        $auth_data = checkTelegramAuthorization($_GET);
        saveTelegramUserData($auth_data);
        addToWhitelist($auth_data['id']);
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    } catch (Exception $e) {
        die($e->getMessage());
    }
}

$tg_user = getTelegramUserData();
if ($tg_user !== false) {
    $auth_data = $tg_user;
    $is_whitelisted = isWhitelisted($auth_data['id']);
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoRaidsBot - Crypto Raid Organizer</title>
    <script async src="https://telegram.org/js/telegram-widget.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #3498db;
            --secondary-color: #2ecc71;
            --background-color: #1a1a2e;
            --text-color: #ffffff;
            --card-bg-color: rgba(255, 255, 255, 0.1);
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--background-color);
            color: var(--text-color);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        .container {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        .card {
            background-color: var(--card-bg-color);
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .logo {
            width: 150px;
            height: auto;
            margin-bottom: 1rem;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        h1 {
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        .btn {
            background-color: var(--primary-color);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 1rem;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background-color: var(--secondary-color);
            transform: translateY(-2px);
        }
        .footer {
            background-color: rgba(0, 0, 0, 0.5);
            padding: 1rem;
            text-align: center;
        }
        .footer-menu {
            display: flex;
            justify-content: space-around;
            margin-bottom: 1rem;
        }
        .footer-menu a {
            color: var(--text-color);
            text-decoration: none;
            font-size: 1.2rem;
            transition: color 0.3s ease;
        }
        .footer-menu a:hover {
            color: var(--primary-color);
        }
        .crypto-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            opacity: 0.1;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin-top: 1rem;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--secondary-color);
        }
        .premium-badge {
            background-color: gold;
            color: black;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
            margin-top: 1rem;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="crypto-background"></div>
    <div class="container">
        <div class="card">
            <img src="https://raw.githubusercontent.com/nectariferous/AutoRaidsBot/main/IMG_9185.jpeg" alt="AutoRaidsBot Logo" class="logo">
            <h1>AutoRaidsBot</h1>
            
            <?php if (!$auth_data): ?>
                <p>Elevate your crypto community with automated raids!</p>
                <script async src="https://telegram.org/js/telegram-widget.js?22" 
                    data-telegram-login="<?= BOT_USERNAME ?>" 
                    data-size="large" 
                    data-auth-url="<?= $_SERVER['PHP_SELF'] ?>" 
                    data-request-access="write">
                </script>
            <?php elseif ($is_whitelisted): ?>
                <p>Welcome back, <?= htmlspecialchars($auth_data['first_name']) ?>!</p>
                <p>You're part of the elite raid squad.</p>
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-value"><?= getTotalWhitelistedUsers() ?></div>
                        <div>Total Raiders</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">5</div>
                        <div>Active Raids</div>
                    </div>
                </div>
                <div class="premium-badge">
                    <i class="fas fa-crown"></i> Premium Member
                </div>
                <a href="https://t.me/<?= BOT_USERNAME ?>?start=dashboard" class="btn">Open Dashboard</a>
                <a href="?logout=1" class="btn" style="background-color: #e74c3c;">Log out</a>
            <?php else: ?>
                <p>Verification complete! Redirecting you to the command center...</p>
                <script>
                    setTimeout(() => {
                        window.location.href = "https://t.me/<?= BOT_USERNAME ?>?start=whitelisted";
                    }, 3000);
                </script>
            <?php endif; ?>
        </div>
    </div>
    <footer class="footer">
        <div class="footer-menu">
            <a href="#" title="Home"><i class="fas fa-home"></i></a>
            <a href="#" title="Features"><i class="fas fa-rocket"></i></a>
            <a href="#" title="Statistics"><i class="fas fa-chart-bar"></i></a>
            <a href="#" title="Support"><i class="fas fa-headset"></i></a>
        </div>
        <div>© 2023 AutoRaidsBot. All rights reserved.</div>
    </footer>
    <script>
        // Create animated crypto background
        const cryptoBackground = document.querySelector('.crypto-background');
        const symbols = ['₿', 'Ξ', '◈', '₳', '₴', '₭'];
        for (let i = 0; i < 50; i++) {
            const symbol = document.createElement('div');
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.position = 'absolute';
            symbol.style.left = `${Math.random() * 100}%`;
            symbol.style.top = `${Math.random() * 100}%`;
            symbol.style.fontSize = `${Math.random() * 20 + 10}px`;
            symbol.style.opacity = Math.random() * 0.5 + 0.1;
            symbol.style.color = 'rgba(255, 255, 255, 0.1)';
            symbol.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
            cryptoBackground.appendChild(symbol);
        }
        
        // Add float animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
                100% { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    </script>
</body>
</html>
