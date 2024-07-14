document.addEventListener('DOMContentLoaded', () => {
    fetch('/profile-info')
        .then(response => response.json())
        .then(data => {
            document.getElementById('greeting').textContent = `Hello, ${data.display_name}`;
            document.getElementById('name').textContent = data.display_name;
            document.getElementById('email').textContent = data.email;
            document.getElementById('wordle-streak').textContent = data.streak;
        })
        .catch(error => console.error('Error fetching profile info:', error));

    document.getElementById('logout-button').addEventListener('click', () => {
        fetch('/logout', {
            method: 'GET'
        })
        .then(() => {
            clearCookiesAndCache();
            window.location.href = '/';
        })
        .catch(error => console.error('Error logging out:', error));
    });
});

function clearCookiesAndCache() {
    if ('caches' in window) {
        caches.keys().then((names) => {
            names.forEach(name => caches.delete(name));
        });
    }

    document.cookie.split(";").forEach((c) => {
        document.cookie = c.trim().split("=")[0] + "=;expires=" + new Date(0).toUTCString() + ";path=/";
    });

    let iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://www.spotify.com/logout/';
    document.body.appendChild(iframe);
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
}
