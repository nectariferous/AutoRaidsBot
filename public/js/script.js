const BOT_USERNAME = 'AutoRaidsBot';
const BOT_TOKEN = '7224059617:AAGjAWXTSraaG1VKNTD9e-OPNATWL_P2RAA';

function createTelegramLoginWidget() {
    const container = document.getElementById('telegram-login-container');
    if (container) {
        container.innerHTML = '';
        const script = document.createElement('script');
        script.async = true;
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute('data-telegram-login', BOT_USERNAME);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-auth-url', 'dashboard.html');
        script.setAttribute('data-request-access', 'write');
        container.appendChild(script);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(localStorage.getItem('tg_user'));
    const loginContent = document.getElementById('login-content');
    const loggedInContent = document.getElementById('logged-in-content');
    const userNameSpan = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');

    function showLoggedInContent(user) {
        loginContent.style.display = 'none';
        loggedInContent.style.display = 'block';
        userNameSpan.textContent = user.first_name;
    }

    function showLoginContent() {
        loginContent.style.display = 'block';
        loggedInContent.style.display = 'none';
    }

    if (userData) {
        showLoggedInContent(userData);
    } else {
        showLoginContent();
    }

    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('tg_user');
        showLoginContent();
    });

    // Telegram Login Widget
    const telegramLoginContainer = document.getElementById('telegram-login-container');
    if (telegramLoginContainer) {
        const script = document.createElement('script');
        script.async = true;
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute('data-telegram-login', 'AutoRaidsBot');
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        telegramLoginContainer.appendChild(script);
    }
});

function onTelegramAuth(user) {
    localStorage.setItem('tg_user', JSON.stringify(user));
    
    // Send authorization data to your server
    fetch('/api/authorize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/dashboard.html';
        } else {
            alert('Authorization failed: ' + data.message);
            localStorage.removeItem('tg_user');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred during authorization. Please try again.');
        localStorage.removeItem('tg_user');
    });
}
function logout() {
    localStorage.removeItem('tg_user');
    window.location.href = 'index.html';
}

function checkAuthorization() {
    const userData = localStorage.getItem('tg_user');
    if (!userData) {
        window.location.href = 'login.html';
    } else {
        displayUserInfo(JSON.parse(userData));
    }
}

function displayUserInfo(user) {
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        userInfoElement.innerHTML = `
            <h2>Welcome, ${user.first_name} ${user.last_name}!</h2>
            <p>You've been successfully authorized and whitelisted for AutoRaidsBot.</p>
        `;
    }
}

function createCryptoBackground() {
    const cryptoBackground = document.querySelector('.crypto-background');
    if (cryptoBackground) {
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
    }
}

function init() {
    createTelegramLoginWidget();
    createCryptoBackground();
    
    if (window.location.pathname.includes('dashboard.html')) {
        checkAuthorization();
    }
}

window.onload = init;

// Handle Telegram login callback
window.onTelegramAuth = function(user) {
    localStorage.setItem('tg_user', JSON.stringify(user));
    window.location.href = 'dashboard.html';
};