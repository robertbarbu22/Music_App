document.addEventListener('DOMContentLoaded', function() {
    const favoritesContainer = document.getElementById('favorites-container');

    fetch('/api/favorites')
        .then(response => response.json())
        .then(favorites => {
            favorites.forEach((favorite, index) => {
                const favoriteElement = document.createElement('div');
                favoriteElement.classList.add('favorite-song');

                favoriteElement.innerHTML = `
                    <img src="${favorite.albumCover}" alt="${favorite.title}" class="album-cover">
                    <div class="song-info">
                        <h3>${index + 1}. ${favorite.title} by ${favorite.artist}</h3>
                        <audio controls>
                            <source src="${favorite.previewUrl}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                `;

                favoritesContainer.appendChild(favoriteElement);
            });
        });
});
