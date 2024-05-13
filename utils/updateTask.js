const events = require('../utils/events');
const OltranzSms = require('../models/oltranzSms');
const MontySms = require('../models/montySms');
const schedule = require('node-schedule');
const { scheduledJobs } = require('../utils/scheduleJob');

// Check and update the status of a task
const checkAndUpdateTaskStatus = async (scheduledSms, model) => {
	try {
		// Check if the job is in the node-schedule's scheduledJobs object
		const oltranzJob = schedule.scheduledJobs[scheduledSms.jobName];

		// Check if the job is in your scheduledJobs object
		const montyJob = scheduledJobs[scheduledSms.jobName];

		// Check if the job is active or inactive then update the status in the database
		const status = oltranzJob || montyJob ? 'Active' : 'Inactive';
		await model.findByIdAndUpdate(scheduledSms._id, { status });
		events.emit('taskUpdated', { taskId: scheduledSms._id, status });
	} catch (error) {
		console.error(`Error updating task status for job ${scheduledSms.jobName}:`, error);
	}
};

// Set all tasks to their actual status when the server restarts
const startup = async () => {
	try {
		// Find all tasks in the database
		const allTasksOltranz = await OltranzSms.find();
		const allTasksMonty = await MontySms.find();

		// For each task in OltranzSms...
		for (const task of allTasksOltranz) {
			// ...check the actual status of the task
			const status = schedule.scheduledJobs[task.jobName] ? 'Active' : 'Inactive';
			// ...update the status in the database
			task.status = status;
			await task.save();
			events.emit('taskUpdated', { taskId: task._id, status });
		}

		// For each task in MontySms...
		for (const task of allTasksMonty) {
			// ...check the actual status of the task
			const status = scheduledJobs[task.jobName] ? 'Active' : 'Inactive';
			// ...update the status in the database
			task.status = status;
			await task.save();
			events.emit('taskUpdated', { taskId: task._id, status });
		}
	} catch (err) {
		console.error('Error setting task status on startup:', err.message);
	}
};

// Check and update the status of all tasks every second if the tasks are active
const checkAndUpdateAllTasks = async () => {
	try {
		// Get all active tasks from both models
		const scheduledSmsListOltranz = await OltranzSms.find({ status: 'Active' });
		const scheduledSmsListMonty = await MontySms.find({ status: 'Active' });

		// Check and update the status of each active task in OltranzSms
		for (const scheduledSms of scheduledSmsListOltranz) {
			await checkAndUpdateTaskStatus(scheduledSms, OltranzSms);
		}

		// Check and update the status of each active task in MontySms
		for (const scheduledSms of scheduledSmsListMonty) {
			await checkAndUpdateTaskStatus(scheduledSms, MontySms);
		}
	} catch (err) {
		console.error('Error checking and updating task status:', err.message);
	} finally {
		// Schedule the next execution of this function
		setTimeout(checkAndUpdateAllTasks, 1000);
	}
};

// Start the loop
checkAndUpdateAllTasks();

module.exports = { checkAndUpdateTaskStatus, startup };