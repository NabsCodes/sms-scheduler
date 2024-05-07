const schedule = require('node-schedule');
const cron = require('node-cron');
const moment = require('moment-timezone');
const { getTokenAndSendMessages } = require('../api/oltranzApi');
const sendSMS = require('../api/montyApi');

// Object to store scheduled jobs 
const scheduledJobs = {};

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
// const scheduleJobByInterval = (jobName, date, startHour, startMinute, interval, endHour, endMinute, destination, source) => {
// 	console.log(jobName, date, startHour, startMinute, interval, endHour, endMinute, destination, source);
// 	// Create moment objects for the start and end times in the specified timezone
// 	const startTime = moment.tz(`${date} ${startHour}:${startMinute}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos').format();
// 	console.log(startTime);
// 	const endTime = moment.tz(`${date} ${endHour}:${endMinute}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');
// 	console.log(endTime);

// 	// Create a job function that sends an SMS
// 	const jobFunction = async () => {
// 		const currentTime = moment.tz('Africa/Lagos');
// 		console.log(currentTime);

// 		// Check if the current date is the same as the scheduled date
// 		if (currentTime.isSame(startTime, 'day')) {
// 			// Calculate the difference in minutes between the current time and the start time
// 			const diff = currentTime.diff(startTime, 'minutes');

// 			// Run the job if the current time is before the end time and the difference is a multiple of the interval
// 			if (currentTime.isSame(startTime, 'minute') || ((currentTime.isBefore(endTime) || currentTime.isSame(endTime, 'minute')) && diff % interval === 0)) {
// 				console.log(`Running job ${jobName} at ${currentTime.format()}`);
// try {
// 	await sendSMS(destination, source);
// } catch (error) {
// 	console.error(`Error running job ${jobName}:`, error);
// }
// 			}

// 			// Get the job from the scheduledJobs object
// 			const job = scheduledJobs[jobName];
// 			// Check if the job exists
// 			if (!job) {
// 				console.log(`Job ${jobName} not found`);
// 				return;
// 			}

// 			// Cancel the job if the current time is past the end time
// 			if (currentTime.isAfter(endTime)) {
// 				job.stop();
// 				delete scheduledJobs[jobName];
// 				console.log(`Job ${jobName} cancelled`);
// 				return;
// 			}
// 		} else {
// 			console.log(`Job ${jobName} is scheduled for another day. Today is not the day to run.`);
// 		}
// 	};

// 	// Schedule the job to run every interval minutes
// 	const job = cron.schedule(`*/${interval} * * * *`, jobFunction, {
// 		scheduled: true,
// 		timezone: "Africa/Lagos"
// 	});

// 	// Store the job in the scheduledJobs object
// 	scheduledJobs[jobName] = job;

// 	// Return the job
// 	return job;
// };


const scheduleJobByInterval = (jobName, date, startHour, startMinute, interval, runCount, destination, source) => {
	// Create moment object for the start time in the specified timezone
	const startTime = moment.tz(`${date} ${startHour}:${startMinute}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

	// Create a job function that sends an SMS and returns a promise
	const jobFunction = async () => {
		console.log(`Running job ${jobName} at ${moment.tz('Africa/Lagos').format("dddd, MMMM Do YYYY, h:mm:ss a")}`);
		try {
			await sendSMS(destination, source);
		} catch (error) {
			console.error(`Error running job ${jobName}:`, error);
		}
	};

	// Schedule the first job at the start time
	let count = 0;
	const firstJob = setTimeout(async function () {
		await jobFunction();
		count++;
		scheduleRemainingJobs();
	}, startTime.diff(moment())); // startTime.diff(moment()) returns the difference in milliseconds between the start time and the current time

	// Store the first job in the scheduledJobs object
	scheduledJobs[jobName] = [firstJob];

	const scheduleRemainingJobs = () => {
		if (count < runCount) {
			const nextJob = setTimeout(async () => {
				await jobFunction();
				count++;
				scheduleRemainingJobs();
			}, interval * 60 * 1000); // Convert the interval to milliseconds and add it to the current time

			// Store the next job in the scheduledJobs object
			scheduledJobs[jobName].push(nextJob);
		} else {
			// Cancel all jobs when the run count is reached
			scheduledJobs[jobName].forEach(clearTimeout);
			delete scheduledJobs[jobName];
			console.log(`Job ${jobName} finished running at ${moment.tz('Africa/Lagos').format("dddd, MMMM Do YYYY, h:mm:ss a")}`);
		}
	};
};

module.exports = { scheduleJobsByDay, scheduleJobByInterval, scheduledJobs };