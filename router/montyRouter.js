const express = require('express');
const router = express.Router();
const montyController = require('../controllers/montyController');
const { storeReturnTo, isLoggedIn } = require('../middlewares/authMiddleware');

// Render the Monty Page
router.get('/', storeReturnTo, isLoggedIn, montyController.renderSchedule);
// Route to handle Monty schedule task request
router.post('/', montyController.scheduleTask);
// Route to handle Monty delete task request
router.delete('/:id', montyController.deleteTask);

module.exports = router;