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

fetch('/api/leaderboard')
    .then(response => response.json())
    .then(data => {
        const leaderboardContainer = document.getElementById('leaderboard-container');
        data.forEach(song => {
            const songElement = document.createElement('div');
            songElement.className = 'song';
            songElement.innerHTML = `
                <div class="song-content">
                    <img src="${song.albumCover}" class="album-cover">
                    <div class="song-info">
                        <p>${song.title} by ${song.artist}</p>
                        <audio controls src="${song.previewUrl}"></audio>
                        <p>Total Score: ${song.totalScore}</p>
                    </div>
                </div>
            `;
            leaderboardContainer.appendChild(songElement);
        });
    });
