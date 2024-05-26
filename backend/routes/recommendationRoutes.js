const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');
const router = express.Router();

router.post('/api/recommendations', getRecommendations);

module.exports = router;
