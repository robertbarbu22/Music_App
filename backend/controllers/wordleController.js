const request = require('request');
const db = require('../config/db');

const getWordle = (req, res) => {
    if (req.session.auth) {
        const userId = req.session.user.id;
        const today = new Date().toISOString().split('T')[0];

        db.get('SELECT date, attempts FROM wordle WHERE user_id = ? ORDER BY date DESC LIMIT 1', [userId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch Wordle data' });
            }
            if (row && row.date === today) {
                // daca deja e intrare azi
                db.get('SELECT word, attempts FROM wordle WHERE user_id = ? AND date = ?', [userId, today], (err, wordleRow) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to fetch Wordle data' });
                    }
                    return res.json({ word: wordleRow.word, attempts: wordleRow.attempts });
                });
            } else {
                // daca nu e
                const options = {
                    url: 'https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M/tracks',
                    headers: { 'Authorization': 'Bearer ' + req.session.auth.access_token },
                    json: true
                };

                request.get(options, (error, response, body) => {
                    if (error || response.statusCode !== 200) {
                        return res.status(500).json({ error: 'Failed to fetch top songs' });
                    }

                    const topArtists = body.items.map(item => item.track.artists[0].name);
                    const filteredArtists = topArtists.filter(artist => artist.length <= 15);
                    const randomArtist = filteredArtists[Math.floor(Math.random() * filteredArtists.length)];

                    db.run('INSERT INTO wordle (user_id, date, word, attempts) VALUES (?, ?, ?, ?)', [userId, today, randomArtist, ''], (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to save Wordle data' });
                        }
                        res.json({ word: randomArtist, attempts: '' });
                    });
                });
            }
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const postWordle = (req, res) => {
    if (req.session.auth) {
        const userId = req.session.user.id;
        const { attempts } = req.body;
        const today = new Date().toISOString().split('T')[0];

        db.get('SELECT word FROM wordle WHERE user_id = ? AND date = ?', [userId, today], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch Wordle data' });
            }
            if (row) {
                const correct = row.word;
                db.run('UPDATE wordle SET attempts = ? WHERE user_id = ? AND date = ?', [attempts, userId, today], (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to update Wordle data' });
                    }

                    if (attempts.includes(correct)) {
                        db.run('UPDATE users SET streak = streak + 1 WHERE id = ?', [userId], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to update streak' });
                            }
                            res.json({ word: correct });
                        });
                    } else {
                        res.json({ word: correct });
                    }
                });
            }
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};


const updateStreak = (req, res) => {
    if (req.session.auth) {
        const userId = req.session.user.id;
        const { success } = req.body;

        if (success) {
            db.get('SELECT streak FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch user data' });
                }
                const newStreak = (row.streak || 0) + 1;
                db.run('UPDATE users SET streak = ? WHERE id = ?', [newStreak, userId], (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to update streak' });
                    }
                    res.json({ streak: newStreak });
                });
            });
        } else {
            res.json({ message: 'No update to streak' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = { getWordle, postWordle, updateStreak };
