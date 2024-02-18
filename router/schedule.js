const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule');

router.get('/', scheduleController.renderSchedule);

router.post('/', scheduleController.scheduleTask);

router.delete('/:id', scheduleController.deleteTask);

module.exports = router;