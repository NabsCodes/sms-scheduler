const events = require('../utils/events');
const MontySms = require('../models/montySms');
const { scheduledJobs, scheduleJobByInterval } = require('../utils/scheduleJob');
const moment = require('moment-timezone');

// Check and update the status of a task
const checkAndUpdateTaskStatus = async (scheduledSms, model) => {
	try {
		// Check if the job is in your scheduledJobs object
		const montyJob = scheduledJobs[scheduledSms.jobName];

		// Check if the job is active or inactive then update the status in the database
		const status = montyJob ? 'Active' : 'Inactive';
		await model.findByIdAndUpdate(scheduledSms._id, { status });
		events.emit('taskUpdated', { taskId: scheduledSms._id, status });

		// Check and update the job counts status
		const activeJobs = await model.countDocuments({ status: 'Active' });
		const inactiveJobs = await model.countDocuments({ status: 'Inactive' });
		events.emit('jobCountsUpdated', { activeJobs, inactiveJobs });
	} catch (error) {
		console.error(`Error updating task status for job ${scheduledSms.jobName}:`, error);
	}
};

// Set all tasks to their actual status when the server restarts
const startup = async () => {
	try {
		// Get all active jobs from the database
		const activeJobs = await MontySms.find({});

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

				// Check if the job has completed all its runs
				if (job.runCountCompleted >= job.runCount) {
					// If the job has completed all its runs, update its status to inactive
					await MontySms.findByIdAndUpdate(job._id, { status: 'Inactive' });
					events.emit('taskUpdated', { taskId: job._id, status: 'Inactive' });
					continue;
				}

				// Join the receivers into a single string
				const message = job.receivers.join(', ');
				// Reschedule the job when the server restarts
				scheduleJobByInterval(job.email, job.jobName, job.date, startHour, startMinute, job.interval, remainingRunCount, message, job.senderId, MontySms);

				// Ensure job status is set to active after scheduling
				setTimeout(async () => {
					await MontySms.findByIdAndUpdate(job._id, { status: 'Active' });
					events.emit('taskUpdated', { taskId: job._id, status: 'Active' });
				}, 1000); // Delay to ensure job is scheduled
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
		// Get all active tasks from database
		const scheduledSmsListMonty = await MontySms.find({ status: 'Active' });

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

module.exports = { startup };