document.getElementById('mode-toggle').addEventListener('click', function() {
    var body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.replace('dark-mode', 'light-mode');
        this.textContent = 'Switch to Dark Mode';
    } else {
        body.classList.replace('light-mode', 'dark-mode');
        this.textContent = 'Switch to Light Mode';
    }
});
