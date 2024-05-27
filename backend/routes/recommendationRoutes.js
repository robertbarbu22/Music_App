const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');

router.post('/api/recommendations', getRecommendations);

module.exports = router;
