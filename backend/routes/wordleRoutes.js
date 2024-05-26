const express = require('express');
const { getWordle, postWordle, updateStreak } = require('../controllers/wordleController');
const router = express.Router();

router.get('/api/wordle', getWordle);
router.post('/api/wordle', postWordle);
router.post('/api/update-streak', updateStreak);

module.exports = router;
