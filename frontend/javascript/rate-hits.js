document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/top-songs')
        .then(response => response.json())
        .then(songs => {
            const songList = document.getElementById('song-list');
            songList.innerHTML = '';

            songs.forEach((song, index) => {
                const songDiv = document.createElement('div');
                songDiv.className = 'song';

                const albumCover = document.createElement('img');
                albumCover.src = song.album_cover;
                albumCover.alt = `${song.title} cover`;
                albumCover.className = 'album-cover';

                const songInfo = document.createElement('div');
                songInfo.className = 'song-info';

                const songTitle = document.createElement('p');
                songTitle.innerHTML = `<strong>${index + 1}. ${song.title} by ${song.artist}</strong>`;

                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = song.preview_url;

                const ratingInput = document.createElement('input');
                ratingInput.type = 'number';
                ratingInput.min = '1';
                ratingInput.max = '10';
                ratingInput.placeholder = 'Rate 1-10';
                ratingInput.className = 'rating-input';

                const rateButton = document.createElement('button');
                rateButton.innerText = 'Rate';
                rateButton.onclick = () => {
                    const rating = ratingInput.value;
                    if (rating >= 1 && rating <= 10) {
                        fetch('/api/rate-song', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                songId: song.id,
                                rating: rating
                            })
                        }).then(response => response.json())
                          .then(data => {
                              alert('Rating saved successfully');
                          });
                    } else {
                        alert('Please enter a rating between 1 and 10');
                    }
                };

                const favoriteButton = document.createElement('button');
                favoriteButton.innerHTML = '⭐';
                favoriteButton.onclick = () => {
                    fetch('/api/add-favorite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            songId: song.id
                        })
                    }).then(response => response.json())
                      .then(data => {
                          alert('Song added to favorites successfully');
                      });
                };

                songInfo.appendChild(songTitle);
                songInfo.appendChild(audio);
                songInfo.appendChild(ratingInput);
                songInfo.appendChild(rateButton);
                songInfo.appendChild(favoriteButton);

                songDiv.appendChild(albumCover);
                songDiv.appendChild(songInfo);
                songList.appendChild(songDiv);
            });
        });
});
