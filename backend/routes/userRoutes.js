const express = require('express');
const { getUserProfile } = require('../controllers/userController');
const router = express.Router();

router.get('/profile-info', getUserProfile);

module.exports = router;
