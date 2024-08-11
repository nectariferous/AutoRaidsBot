document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const authData = {
        id: urlParams.get('id'),
        first_name: urlParams.get('first_name'),
        last_name: urlParams.get('last_name'),
        username: urlParams.get('username'),
        photo_url: urlParams.get('photo_url'),
        auth_date: urlParams.get('auth_date'),
        hash: urlParams.get('hash')
    };

    if (authData.id && authData.hash) {
        authorizeUser(authData);
    } else {
        updateStatus('Error: Invalid authorization data', true);
    }
});

function onTelegramAuth(user) {
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
            localStorage.setItem('userData', JSON.stringify(data.user));
            window.location.href = '/success.html';
        } else {
            alert('Authorization failed: ' + data.message);
        }
    })
    .catch((error) => {
        alert('Error: ' + error.message);
    });
}

function updateStatus(message, isError) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    if (isError) {
        statusElement.style.color = 'red';
    }
    document.getElementById('loading-spinner').style.display = 'none';
}