function getRecommendations() {
    const happinessLevel = document.getElementById('happiness-input').value;

    if (happinessLevel < 1 || happinessLevel > 10) {
        showToast();
        return;
    }

    const userData = {
        likedArtists: ['Artist1', 'Artist2'], // Înlocuiește cu datele reale ale utilizatorului
        likedSongs: ['Song1', 'Song2'],
        preferredGenres: ['Genre1', 'Genre2']
    };

    fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ happinessLevel, userData })
    })
    .then(response => response.json())
    .then(data => {
        const recommendationsDiv = document.getElementById('recommendations');
        recommendationsDiv.innerHTML = '';

        data.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song';
            songDiv.innerHTML = `
                <div class="song-title">${song}</div>
            `;
            recommendationsDiv.appendChild(songDiv);
        });
    })
    .catch(error => console.error('Error fetching recommendations:', error));
}
