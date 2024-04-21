const express = require('express');
const router = express.Router();
const oltranzController = require('../controllers/oltranzController');
const { storeReturnTo, isLoggedIn } = require('../middlewares/authMiddleware');

// Render the Oltanz Page
router.get('/', storeReturnTo, isLoggedIn, oltranzController.renderSchedule);
// Route to handle Oltranz schedule task request
router.post('/', oltranzController.scheduleTask);
// Route to handle Oltranz delete task request
router.delete('/:id', oltranzController.deleteTask);

module.exports = router;