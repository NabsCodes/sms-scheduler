const express = require('express');
const router = express.Router();
const montyController = require('../controllers/montyController');
const { storeReturnTo, isLoggedIn } = require('../middlewares/authMiddleware');

// Render the Monty schedule page
router.get('/', storeReturnTo, isLoggedIn, montyController.renderSchedule);
// Route to handle Monty schedule task request
router.post('/', montyController.scheduleTask);
// Route to handle Monty delete task request
router.delete('/:id', montyController.deleteTask);

// Route to render the send sms page
router.get('/sendnow', storeReturnTo, isLoggedIn, montyController.renderSend);
// Route to send sms at once
router.post('/sendnow', montyController.sendNow);

module.exports = router;