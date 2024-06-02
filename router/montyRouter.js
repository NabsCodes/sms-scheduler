const express = require('express');
const router = express.Router();
const montyController = require('../controllers/montyController');
const { storeReturnTo, isLoggedIn } = require('../middlewares/authMiddleware');

router.get('/', storeReturnTo, isLoggedIn, montyController.renderSchedule); // Render the Monty schedule page
router.post('/', montyController.scheduleTask); // Route to handle Monty schedule task request
router.delete('/:id', montyController.deleteTask); // Route to handle Monty delete task request

router.get('/sendnow', storeReturnTo, isLoggedIn, montyController.renderSend); // Route to render the send sms page
router.post('/sendnow', montyController.sendNow); // Route to send sms at once

module.exports = router;