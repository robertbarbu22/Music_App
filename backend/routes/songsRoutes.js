const express = require('express');
const { updateViralSongs, getTopSongs, rateSong, getLeaderboard } = require('../controllers/songsController');
const router = express.Router();

router.get('/api/top-songs', getTopSongs);
router.post('/api/rate-song', rateSong);
router.get('/api/leaderboard', getLeaderboard);

module.exports = router;
