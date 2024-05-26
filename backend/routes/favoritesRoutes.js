const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');

router.post('/api/add-favorite', favoritesController.addFavorite);
router.post('/api/remove-favorite', favoritesController.removeFavorite);
router.get('/api/favorites', favoritesController.getFavorites);

module.exports = router;
