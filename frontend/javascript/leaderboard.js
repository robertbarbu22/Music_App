document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/leaderboard')
        .then(response => response.json())
        .then(data => {
            const leaderboardContainer = document.getElementById('leaderboard-container');
            leaderboardContainer.innerHTML = '';

            data.forEach(song => {
                const songElement = document.createElement('div');
                songElement.className = 'song';

                const albumCover = document.createElement('img');
                albumCover.src = song.albumCover;
                albumCover.alt = `${song.title} cover`;
                albumCover.className = 'album-cover';

                const songInfo = document.createElement('div');
                songInfo.className = 'song-info';

                const songTitle = document.createElement('p');
                songTitle.textContent = `${song.title} by ${song.artist}`;

                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = song.previewUrl;

                const totalScore = document.createElement('p');
                totalScore.textContent = `Total Score: ${song.total_rating}`;

                songInfo.appendChild(songTitle);
                songInfo.appendChild(audio);
                songInfo.appendChild(totalScore);

                songElement.appendChild(albumCover);
                songElement.appendChild(songInfo);
                leaderboardContainer.appendChild(songElement);
            });
        })
        .catch(error => console.error('Error fetching leaderboard:', error));
});
