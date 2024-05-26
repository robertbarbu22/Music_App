const request = require('request');
const db = require('../config/db');

const updateViralSongs = (accessToken, callback) => {
    db.get(`SELECT date FROM last_update`, (err, row) => {
        if (err) {
            return callback(err);
        }

        const lastUpdate = row.date;
        const today = new Date().toISOString().split('T')[0];

        if (lastUpdate !== today) {
            const options = {
                url: 'https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks',
                headers: { 'Authorization': 'Bearer ' + accessToken },
                json: true
            };

            request.get(options, (error, response, body) => {
                if (error || response.statusCode !== 200) {
                    return callback(error || new Error('Failed to fetch top songs'));
                }

                const topSongs = body.items.slice(0, 15).map(item => ({
                    id: item.track.id,
                    title: item.track.name,
                    artist: item.track.artists.map(artist => artist.name).join(', '),
                    albumCover: item.track.album.images[0].url,
                    previewUrl: item.track.preview_url
                }));

                db.serialize(() => {
                    db.run(`DELETE FROM viral_songs`);
                    const stmt = db.prepare(`INSERT INTO viral_songs (id, title, artist, album_cover, preview_url) VALUES (?, ?, ?, ?, ?)`);
                    topSongs.forEach(song => {
                        stmt.run(song.id, song.title, song.artist, song.albumCover, song.previewUrl);
                    });
                    stmt.finalize();

                    db.run(`UPDATE last_update SET date = ?`, [today], (err) => {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, topSongs);
                    });
                });
            });
        } else {
            db.all(`SELECT * FROM viral_songs`, (err, rows) => {
                if (err) {
                    return callback(err);
                }
                callback(null, rows);
            });
        }
    });
};

const getTopSongs = (req, res) => {
    if (req.session.auth) {
        db.all(`SELECT * FROM viral_songs`, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch top songs' });
            }
            res.json(rows);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const rateSong = (req, res) => {
    const { songId, rating } = req.body;
    const userId = req.session.user.id;
    const date = new Date().toISOString().split('T')[0];

    db.get(`SELECT * FROM ratings WHERE song_id = ? AND user_id = ? AND date = ?`, [songId, userId, date], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch rating data' });
        }

        if (row) {
            return res.status(400).json({ error: 'You have already rated this song today' });
        }

        db.run(`INSERT INTO ratings (song_id, user_id, rating, date) VALUES (?, ?, ?, ?)`,
            [songId, userId, rating, date],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save rating' });
                }
                res.json({ message: 'Rating saved successfully' });
            });
    });
};

const getLeaderboard = (req, res) => {
    if (req.session.auth) {
        db.all(`
            SELECT song_id, SUM(rating) as total_rating
            FROM ratings
            GROUP BY song_id
            ORDER BY total_rating DESC
        `, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch leaderboard' });
            }

            // Obține detaliile melodiilor
            const songIds = rows.map(row => row.song_id);
            db.all(`SELECT * FROM viral_songs WHERE id IN (${songIds.map(() => '?').join(',')})`, songIds, (err, songs) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch song details' });
                }

                const leaderboard = rows.map(row => {
                    const song = songs.find(s => s.id === row.song_id);
                    return {
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        albumCover: song.album_cover,
                        previewUrl: song.preview_url,
                        total_rating: row.total_rating
                    };
                });

                res.json(leaderboard);
            });
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = { updateViralSongs, getTopSongs, rateSong, getLeaderboard };
