const request = require('request');
const db = require('../config/db');
const CLIENT_ID = '3b289e49605a49859e57d189bfeb393b';
const CLIENT_SECRET = '6ff5a4b16c5a409da0708e376fe80f26';
const REDIRECT_URI = 'http://localhost:8888/callback';

const login = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        } else {
            console.log('Session destroyed successfully');
            res.clearCookie('connect.sid', { path: '/' }); 
            const scope = 'user-read-private user-read-email user-library-modify';
            res.redirect('https://accounts.spotify.com/authorize?' +
                new URLSearchParams({
                    response_type: 'code',
                    client_id: CLIENT_ID,
                    scope: scope,
                    redirect_uri: REDIRECT_URI
                }));
        }
    });
};

const callback = (req, res) => {
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

                // Obtine datele utilizatorului
                const userOptions = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                request.get(userOptions, (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        req.session.user = body;
                        // Salvare date utilizator in baza de date
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
};

module.exports = { login, callback };
