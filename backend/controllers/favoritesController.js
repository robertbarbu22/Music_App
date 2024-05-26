const request = require('request');
const db = require('../config/db');

// Funcția pentru a adăuga o piesă la favorite și la Liked Songs pe Spotify
const addFavorite = (req, res) => {
    const { songId } = req.body;
    const userId = req.session.user.id;
    const dateAdded = new Date().toISOString();

    console.log(`Adding favorite: songId=${songId}, userId=${userId}`);

    const options = {
        url: `https://api.spotify.com/v1/me/tracks?ids=${songId}`,
        headers: { 'Authorization': 'Bearer ' + req.session.auth.access_token },
        json: true
    };

    request.put(options, (error, response) => {
        if (error || response.statusCode !== 200) {
            console.error('Error adding song to Spotify Liked Songs:', error || response.statusCode);
            return res.status(500).json({ error: 'Failed to add song to Spotify Liked Songs' });
        }

        db.run(`INSERT OR REPLACE INTO favorites (song_id, user_id, date_added) VALUES (?, ?, ?)`,
            [songId, userId, dateAdded],
            function (err) {
                if (err) {
                    console.error('Error adding favorite to database:', err);
                    return res.status(500).json({ error: 'Failed to add favorite' });
                }
                console.log('Song added to favorites and Spotify Liked Songs successfully');
                res.json({ message: 'Song added to favorites and Spotify Liked Songs successfully' });
            });
    });
};

// Funcția pentru a elimina o piesă din favorite și din Liked Songs pe Spotify
const removeFavorite = (req, res) => {
    const { songId } = req.body;
    const userId = req.session.user.id;

    console.log(`Removing favorite: songId=${songId}, userId=${userId}`);

    const options = {
        url: `https://api.spotify.com/v1/me/tracks?ids=${songId}`,
        headers: { 'Authorization': 'Bearer ' + req.session.auth.access_token },
        json: true
    };

    request.delete(options, (error, response) => {
        if (error || response.statusCode !== 200) {
            console.error('Error removing song from Spotify Liked Songs:', error || response.statusCode);
            return res.status(500).json({ error: 'Failed to remove song from Spotify Liked Songs' });
        }

        db.run(`DELETE FROM favorites WHERE song_id = ? AND user_id = ?`, [songId, userId], function (err) {
            if (err) {
                console.error('Error removing favorite from database:', err);
                return res.status(500).json({ error: 'Failed to remove favorite' });
            }
            console.log('Song removed from favorites and Spotify Liked Songs successfully');
            res.json({ message: 'Song removed from favorites and Spotify Liked Songs successfully' });
        });
    });
};

const getFavorites = (req, res) => {
    const userId = req.session.user.id;
    console.log(`Fetching favorites for userId=${userId}`);
    db.all(`SELECT * FROM viral_songs WHERE id IN (SELECT song_id FROM favorites WHERE user_id = ?)`, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching favorite songs from database:', err);
            return res.status(500).json({ error: 'Failed to fetch favorite songs' });
        }
        res.json(rows);
    });
};

module.exports = { addFavorite, removeFavorite, getFavorites };
