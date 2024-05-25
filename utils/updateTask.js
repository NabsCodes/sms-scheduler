const events = require('../utils/events');
const OltranzSms = require('../models/oltranzSms');
const MontySms = require('../models/montySms');
const schedule = require('node-schedule');
const { scheduledJobs, scheduleJobByInterval } = require('../utils/scheduleJob');
const moment = require('moment-timezone');

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
		// Get all active jobs from the database
		const activeJobs = await MontySms.find({ status: 'Active' });

		// Reschedule each active job
		for (const job of activeJobs) {
			try {
				// Get the original start time and date
				const originalStartTime = moment(`${job.date} ${job.startTime}`, 'YYYY-MM-DD HH:mm');

				// Calculate the next run time based on the original start time and the number of times the job has already run
				let nextRunTime = moment(originalStartTime).add(job.interval * job.runCountCompleted, 'minutes');

				// If the next run time is in the past, calculate the next future run time
				while (nextRunTime.isBefore(moment())) {
					nextRunTime = nextRunTime.add(job.interval, 'minutes');
				}

				console.log(`${job.jobName}: ${nextRunTime.format('YYYY-MM-DD HH:mm')}`);

				// Extract the start hour and start minute from the next run time
				const startHour = nextRunTime.hour();
				const startMinute = nextRunTime.minute();

				// Calculate the remaining run count
				const remainingRunCount = job.runCount - job.runCountCompleted;

				// Join the receivers into a single string
				const message = job.receivers.join(', ');
				// Reschedule the job when the server restarts
				scheduleJobByInterval(job.jobName, job.date, startHour, startMinute, job.interval, remainingRunCount, message, job.senderId, MontySms);
			} catch (err) {
				console.error(`Error rescheduling job ${job.jobName}:`, err);
			}
		}
	} catch (err) {
		console.error('Error fetching active jobs on startup:', err);
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

// Start the loop to check and update all tasks
checkAndUpdateAllTasks();

module.exports = { checkAndUpdateTaskStatus, startup };