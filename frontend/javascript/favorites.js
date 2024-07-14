document.addEventListener('DOMContentLoaded', () => {
    fetchFavorites();
});

function fetchFavorites() {
    fetch('/api/favorites')
        .then(response => response.json())
        .then(data => {
            const favoritesContainer = document.getElementById('favorites-container');
            favoritesContainer.innerHTML = '';
            data.forEach((song, index) => {
                const songElement = document.createElement('div');
                songElement.classList.add('favorite-song');
                songElement.innerHTML = `
                    <div class="favorite-song-content">
                        <img class="album-cover" src="${song.album_cover || '/path/to/default_cover.jpg'}" alt="${song.title}">
                        <div class="song-info">
                            <span>${index + 1}. ${song.title} by ${song.artist}</span>
                            <audio controls>
                                <source src="${song.preview_url || ''}" type="audio/mpeg">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                        <button class="remove-button" data-id="${song.song_id}">Remove</button>
                    </div>
                `;
                favoritesContainer.appendChild(songElement);
            });

            document.querySelectorAll('.remove-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const songId = event.target.dataset.id;
                    fetch('/api/remove-favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ songId })
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log(data.message);
                            fetchFavorites();  // Refresh dupa stergere
                        })
                        .catch(error => {
                            console.error('Error removing favorite:', error);
                        });
                });
            });
        })
        .catch(error => console.error('Error fetching favorite songs:', error));
}
