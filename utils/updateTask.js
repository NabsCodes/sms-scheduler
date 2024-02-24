const events = require('../utils/events');
const ScheduledSms = require('../models/scheduledSms');

// Check and update the status of a task
const checkAndUpdateTaskStatus = async (scheduledSms) => {
	const currentTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
	const endTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
	const [endHour, endMinute] = scheduledSms.endTime.split(':').map(Number);
	endTime.setHours(endHour, endMinute);

	if (currentTime >= endTime) {
		await ScheduledSms.findByIdAndUpdate(scheduledSms._id, { status: 'Inactive' });
		events.emit('taskUpdated', { taskId: scheduledSms._id, status: 'Inactive' });
	}
};

// Set all tasks to 'Inactive' when the server restarts
const startup = async () => {
	try {
		// Find all tasks in the database that are marked as 'Active'
		const activeTasks = await ScheduledSms.find({ status: 'Active' });

		// For each active task...
		for (const task of activeTasks) {
			// ...set the status to 'Inactive'
			task.status = 'Inactive';
			await task.save();

			events.emit('taskUpdated', { taskId: task._id, status: 'Inactive' });
		}
	} catch (err) {
		console.error('Error in startup function:', err.message);
	}
};

// Check and update the status of all tasks after every second when the server is running
setInterval(async () => {
	try {
		const scheduledSmsList = await ScheduledSms.find({ status: 'Active' });
		for (const scheduledSms of scheduledSmsList) {
			await checkAndUpdateTaskStatus(scheduledSms);
		}
	} catch (err) {
		console.error('Error checking and updating task status:', err.message);
	}
}, 1000);



module.exports = { checkAndUpdateTaskStatus, startup };