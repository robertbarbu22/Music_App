const express = require('express');
const session = require('express-session');
const path = require('path');
const request = require('request');
const sqlite3 = require('sqlite3').verbose();

const app = express();

const CLIENT_ID = '3b289e49605a49859e57d189bfeb393b';
const CLIENT_SECRET = '6ff5a4b16c5a409da0708e376fe80f26';
const REDIRECT_URI = 'http://localhost:8888/callback';

// Conectare la baza de date SQLite
const db = new sqlite3.Database('./database.sqlite');

// Configurare sesiuni
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
}));

// Configurare pentru parsarea JSON
app.use(express.json());

// Setează directorul 'frontend' pentru a servi conținut static
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rută pentru pagina principală
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'login.html'));
});

// Ruta pentru inițierea autentificării cu Spotify
app.get('/login', (req, res) => {
    // Resetează sesiunea înainte de redirecționare
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        const scope = 'user-read-private user-read-email';
        res.redirect('https://accounts.spotify.com/authorize?' +
            new URLSearchParams({
                response_type: 'code',
                client_id: CLIENT_ID,
                scope: scope,
                redirect_uri: REDIRECT_URI
            }));
    });
});

// Callback pentru autentificarea cu Spotify
app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    if (code) {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const access_token = body.access_token;
                const refresh_token = body.refresh_token;

                req.session.auth = {
                    'access_token': access_token,
                    'refresh_token': refresh_token
                };

                // Obține datele utilizatorului
                const userOptions = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                request.get(userOptions, (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        req.session.user = body;
                        // Salvare date utilizator în baza de date
                        const { id, display_name, email } = body;
                        db.get(`SELECT streak FROM users WHERE id = ?`, [id], (err, row) => {
                            if (err) {
                                console.error('Error fetching user data:', err);
                                return res.redirect('/#error=database_error');
                            }
                            const streak = row ? row.streak : 0;
                            db.run(`INSERT OR REPLACE INTO users (id, display_name, email, streak) VALUES (?, ?, ?, ?)`, [id, display_name, email, streak], (err) => {
                                if (err) {
                                    console.error('Error inserting user data:', err);
                                }
                                res.redirect('/home');
                            });
                        });
                    } else {
                        res.redirect('/#error=' + response.statusCode);
                    }
                });
            } else {
                res.redirect('/#error=' + response.statusCode);
            }
        });
    } else {
        res.redirect('/#error=invalid_token');
    }
});


// Verifică și actualizează piesele virale o dată pe zi
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

// Ruta pentru pagina de home
app.get('/home', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'home.html'));
    } else {
        res.redirect('/');
    }
});

// Ruta pentru pagina de profil
app.get('/profile', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'profile.html'));
    } else {
        res.redirect('/');
    }
});

// Ruta pentru informațiile de profil
app.get('/profile-info', (req, res) => {
    if (req.session.auth && req.session.user) {
        const userId = req.session.user.id;
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch user data' });
            }
            if (row) {
                return res.json({
                    display_name: row.display_name,
                    email: row.email,
                    streak: row.streak || 0
                });
            } else {
                return res.status(404).json({ error: 'User not found' });
            }
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// Ruta pentru pagina de rate hits
app.get('/rate-hits', (req, res) => {
    if (req.session.auth) {
        updateViralSongs(req.session.auth.access_token, (err, songs) => {
            if (err) {
                return res.status(500).send('Failed to fetch top songs');
            }
            res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'rate-hits.html'));
        });
    } else {
        res.redirect('/');
    }
});

// Ruta pentru pagina de favorites
app.get('/favorites', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'favorites.html'));
    } else {
        res.redirect('/');
    }
});

// Ruta pentru pagina de leaderboard
app.get('/leaderboard', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'leaderboard.html'));
    } else {
        res.redirect('/');
    }
});

// Ruta pentru pagina de wordle
app.get('/music-wordle', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'music-wordle.html'));
    } else {
        res.redirect('/');
    }
});

// Ruta pentru logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Ruta pentru obținerea topului zilnic de pe Spotify
app.get('/api/top-songs', (req, res) => {
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
});

// Ruta pentru salvarea ratingurilor
app.post('/api/rate-song', express.json(), (req, res) => {
    const { songId, rating } = req.body;
    const userId = req.session.user.id;
    const date = new Date().toISOString().split('T')[0];

    db.run(`INSERT OR REPLACE INTO ratings (song_id, user_id, rating, date) VALUES (?, ?, ?, ?)`,
        [songId, userId, rating, date],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to save rating' });
            }
            res.json({ message: 'Rating saved successfully' });
        });
});

// Ruta pentru adăugarea unei melodii la favorite
app.post('/api/add-favorite', express.json(), (req, res) => {
    const { songId } = req.body;
    const userId = req.session.user.id;
    const dateAdded = new Date().toISOString();

    db.run(`INSERT OR REPLACE INTO favorites (song_id, user_id, date_added) VALUES (?, ?, ?)`,
        [songId, userId, dateAdded],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to add favorite' });
            }
            res.json({ message: 'Song added to favorites successfully' });
        });
});

// Ruta pentru obținerea melodiilor favorite
app.get('/api/favorites', (req, res) => {
    if (req.session.auth) {
        const userId = req.session.user.id;
        db.all(`SELECT * FROM viral_songs WHERE id IN (SELECT song_id FROM favorites WHERE user_id = ?)`, [userId], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch favorite songs' });
            }
            res.json(rows);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// Ruta pentru obținerea clasamentului comunității
app.get('/api/leaderboard', (req, res) => {
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
                        ...song,
                        total_rating: row.total_rating
                    };
                });

                res.json(leaderboard);
            });
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get('/api/wordle', (req, res) => {
    if (req.session.auth) {
        const userId = req.session.user.id;
        const today = new Date().toISOString().split('T')[0];

        db.get('SELECT word, attempts FROM wordle WHERE user_id = ? AND date = ?', [userId, today], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch Wordle data' });
            }
            if (row) {
                return res.json({ word: row.word, attempts: row.attempts });
            }

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
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.post('/api/wordle', (req, res) => {
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
});

app.post('/api/update-streak', (req, res) => {
    if (req.session.auth) {
        const userId = req.session.user.id;
        const { success } = req.body;

        if (success) {
            db.run('UPDATE users SET streak = streak + 1 WHERE id = ?', [userId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update streak' });
                }
                db.get('SELECT streak FROM users WHERE id = ?', [userId], (err, row) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to fetch streak' });
                    }
                    res.json({ streak: row.streak });
                });
            });
        } else {
            res.json({ message: 'No update to streak' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.listen(8888, () => {
    console.log('Server running on http://localhost:8888');
});
