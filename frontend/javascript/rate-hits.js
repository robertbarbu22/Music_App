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

                const ratingSection = document.createElement('div');
                ratingSection.className = 'rating-section';

                const ratingInput = document.createElement('input');
                ratingInput.type = 'number';
                ratingInput.min = '1';
                ratingInput.max = '10';
                ratingInput.placeholder = 'Rate 1-10';
                ratingInput.className = 'rating-input';
                ratingInput.dataset.songId = song.id;

                const favoriteButton = document.createElement('button');
                favoriteButton.innerHTML = '⭐';
                favoriteButton.className = 'favorite-button';
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

                ratingSection.appendChild(favoriteButton);
                ratingSection.appendChild(ratingInput);

                songInfo.appendChild(songTitle);
                songInfo.appendChild(audio);
                songInfo.appendChild(ratingSection);

                songDiv.appendChild(albumCover);
                songDiv.appendChild(songInfo);
                songList.appendChild(songDiv);
            });

            const rateAllButton = document.getElementById('rate-all-button');
            rateAllButton.disabled = false;

            rateAllButton.addEventListener('click', () => {
                const ratingInputs = document.querySelectorAll('.rating-input');
                const ratings = Array.from(ratingInputs).map(input => {
                    return {
                        songId: input.dataset.songId,
                        rating: input.value
                    };
                });

                if (ratings.some(r => !r.rating)) {
                    alert('Please rate all songs before submitting.');
                    return;
                }

                Promise.all(ratings.map(r => {
                    return fetch('/api/rate-song', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(r)
                    });
                }))
                .then(() => {
                    alert('All ratings saved successfully');
                })
                .catch(err => {
                    console.error('Error saving ratings:', err);
                    alert('An error occurred while saving ratings');
                });
            });
        });
});
