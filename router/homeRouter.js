const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { storeReturnTo, isLoggedIn } = require('../middlewares/authMiddleware');

// Render the home page
router.get('/', storeReturnTo, isLoggedIn, homeController.renderHome);

module.exports = router;