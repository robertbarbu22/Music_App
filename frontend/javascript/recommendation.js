document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.submit-button').addEventListener('click', () => {
        const happinessLevelInput = document.getElementById('happiness-input');
        const happinessLevel = parseInt(happinessLevelInput.value, 10);

        if (isNaN(happinessLevel) || happinessLevel < 1 || happinessLevel > 10) {
            alert('Please enter an integer between 1 and 10.');
            happinessLevelInput.value = ''; // clear daca nu e input valid
            return;
        }

        fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ happinessLevel })
        })
        .then(response => response.json())
        .then(data => {
            const recommendationsDiv = document.getElementById('recommendations');
            recommendationsDiv.innerHTML = '';

            data.recommendations.forEach(song => {
                const songDiv = document.createElement('div');
                songDiv.className = 'song';

                const albumCover = document.createElement('img');
                albumCover.src = song.albumCover || '/path/to/default_cover.jpg';
                albumCover.alt = `${song.title} cover`;

                const songInfo = document.createElement('div');
                songInfo.className = 'song-info';

                const songTitle = document.createElement('p');
                songTitle.className = 'song-title';
                songTitle.textContent = `${song.title} by ${song.artist}`;

                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = song.previewUrl || '';

                const favoriteButton = document.createElement('button');
                favoriteButton.className = 'favorite-button';
                favoriteButton.innerHTML = '⭐';
                favoriteButton.onclick = () => {
                    fetch('/api/add-favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            songId: song.id,
                            title: song.title,
                            artist: song.artist,
                            albumCover: song.albumCover,
                            previewUrl: song.previewUrl
                        })
                    }).then(response => response.json())
                      .then(data => {
                          alert('Song added to favorites successfully');
                      });
                };

                songInfo.appendChild(songTitle);
                songInfo.appendChild(audio);
                songDiv.appendChild(albumCover);
                songDiv.appendChild(songInfo);
                songDiv.appendChild(favoriteButton);
                recommendationsDiv.appendChild(songDiv);
            });
        })
        .catch(error => console.error('Error fetching recommendations:', error));
    });
});
