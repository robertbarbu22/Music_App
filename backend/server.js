const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/db');

const app = express();

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

// Rute
const authRoutes = require('./routes/authRoutes');
const wordleRoutes = require('./routes/wordleRoutes');
const userRoutes = require('./routes/userRoutes');
const songsRoutes = require('./routes/songsRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');

app.use(authRoutes);
app.use(wordleRoutes);
app.use(userRoutes);
app.use(songsRoutes);
app.use(favoritesRoutes);

// Rută pentru pagina principală
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'login.html'));
});

// Rute pentru pagini
app.get('/home', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'home.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/profile', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'profile.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/rate-hits', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'rate-hits.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/favorites', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'favorites.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/leaderboard', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'leaderboard.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/music-wordle', (req, res) => {
    if (req.session.auth) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'music-wordle.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.listen(8888, () => {
    console.log('Server running on http://localhost:8888');
});
