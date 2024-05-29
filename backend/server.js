const express = require('express');
const session = require('express-session');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const cron = require('node-cron');
const db = require('./config/db');  

const app = express();

// Configurare sesiuni
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 zi
    }
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
const recommendationRoutes = require('./routes/recommendationRoutes');

app.use(authRoutes);
app.use(wordleRoutes);
app.use(userRoutes);
app.use(songsRoutes);
app.use(favoritesRoutes);
app.use(recommendationRoutes);

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

// Task-ul de ștergere a intrărilor din leaderboard
cron.schedule('0 0 * * *', () => {
    console.log('Running a task every day at midnight');
    db.run(`DELETE FROM ratings`, (err) => {
        if (err) {
            console.error('Failed to delete leaderboard data:', err);
        } else {
            console.log('Leaderboard data cleared successfully');
        }
    });
});

// Funcție pentru a obține recomandări de la API-ul OpenAI
async function getRecommendations(userData) {
    const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
        prompt: `Give me 15 song recommendations for a user with the following details: 
                 Happiness Level: ${userData.happinessLevel}, 
                 Liked Artists: ${userData.likedArtists.join(', ')}, 
                 Liked Songs: ${userData.likedSongs.join(', ')}, 
                 Preferred Genres: ${userData.preferredGenres.join(', ')}.`,
        max_tokens: 150,
        temperature: 0.7
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    return response.data.choices[0].text;
}

// Rută pentru a obține recomandări
app.post('/api/recommendations', async (req, res) => {
    const userData = req.body;

    try {
        const recommendations = await getRecommendations(userData);
        res.json({ recommendations });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Rută pentru pagina de recomandări
app.get('/recommendations', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'recommendations.html'));
});

app.listen(8888, () => {
    console.log('Server running on http://localhost:8888');
});
