const schedule = require('node-schedule');
const cron = require('node-cron');
const moment = require('moment-timezone');
const { getTokenAndSendMessages } = require('./oltranzApi');
const sendSMS = require('./montyApi');

// Object to store scheduled jobs
let scheduledJobs = {};

// Schedule a job by day of the week
const scheduleJobByDay = (jobName, day, hour, minute, receivers, titles) => {
	const scheduleOptions = { dayOfWeek: day, hour, minute, tz: 'Africa/Lagos' };
	const job = schedule.scheduleJob(jobName, scheduleOptions, async () => {
		try {
			for (const title of titles) {
				await getTokenAndSendMessages(jobName, receivers, title);
			}
		} catch (error) {
			console.error(`Error running job ${jobName}:`, error);
		}
		if (job) {
			job.cancel();
		}
	});
};

// Schedule multiple jobs by day of the week
const scheduleJobsByDay = (jobName, days, hour, minute, receivers, title) => {
	days.forEach(day => scheduleJobByDay(jobName, day, hour, minute, receivers, title));
	return 'Jobs scheduled successfully!';
};

// Schedule a job by interval
const scheduleJobByInterval = (jobName, date, startHour, startMinute, interval, endHour, endMinute, destination, source) => {
	// Create moment objects for the start and end times in the specified timezone
	let startTime = moment.tz(`${date} ${startHour}:${startMinute}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');
	let endTime = moment.tz(`${date} ${endHour}:${endMinute}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

	const jobFunction = async () => {
		let currentTime = moment.tz('Africa/Lagos');

		// Check if the current date is the same as the scheduled date
		if (currentTime.isSame(startTime, 'day')) {
			// Calculate the difference in minutes between the current time and the start time
			let diff = currentTime.diff(startTime, 'minutes');

			// Run the job if the current time is before the end time and the difference is a multiple of the interval
			if (currentTime.isSame(startTime, 'minute') || ((currentTime.isBefore(endTime) || currentTime.isSame(endTime, 'minute')) && diff % interval === 0)) {
				console.log(`Running job ${jobName} at ${currentTime.format()}`);
				try {
					await sendSMS(destination, source);
				} catch (error) {
					console.error(`Error running job ${jobName}:`, error);
				}
			}

			// Cancel the job if the current time is past the end time
			if (currentTime.isAfter(endTime)) {
				job.stop();
				delete scheduledJobs[jobName];
				console.log(`Job ${jobName} cancelled`);
			}
		} else {
			console.log(`Job ${jobName} is scheduled for another day. Today is not the day to run.`);
		}
	};

	// Schedule the job to run every interval minutes
	let job = cron.schedule(`*/${interval} * * * *`, jobFunction, {
		scheduled: true,
		timezone: "Africa/Lagos"
	});

	// Store the job in the scheduledJobs object
	scheduledJobs[jobName] = job;

	// Return the job
	return job;
};

module.exports = { scheduleJobsByDay, scheduleJobByInterval, scheduledJobs };