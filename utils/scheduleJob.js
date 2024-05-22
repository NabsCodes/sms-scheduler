const schedule = require('node-schedule');
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
const scheduleJobByInterval = (jobName, date, startHour, startMinute, interval, runCount, destination, source, model) => {
	let count = 0; // Initialize the count of job runs

	const startTime = moment.tz(`${date} ${startHour}:${startMinute}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

	// Function to run the job and send SMS
	const jobFunction = async () => {
		console.log(`Running job ${jobName} at ${moment.tz('Africa/Lagos').format("dddd, MMMM Do YYYY, h:mm:ss a")}`);
		try {
			await sendSMS(destination, source);
			// Update the run count completed in the database
			await model.findOneAndUpdate({ jobName }, { $inc: { runCountCompleted: 1 } });
		} catch (error) {
			console.error(`Error running job ${jobName}:`, error);
		}
	};

	// Function to schedule the next job
	const scheduleNextJob = () => {
		if (count < runCount) {
			const nextJob = setTimeout(async () => {
				await jobFunction();
				count++;
				scheduleNextJob();
			}, interval * 60 * 1000);

			scheduledJobs[jobName].push(nextJob);
		} else {
			scheduledJobs[jobName].forEach(clearTimeout);
			delete scheduledJobs[jobName];
			console.log(`Job ${jobName} finished running at ${moment.tz('Africa/Lagos').format("dddd, MMMM Do YYYY, h:mm:ss a")}`);
		}
	};

	// Run the job function and schedule the next job
	const runJob = async () => {
		try {
			await jobFunction();
			count++;
			scheduleNextJob();
		} catch (error) {
			console.error(`Error in runJob for ${jobName}:`, error);
		}
	};

	// Schedule the first job to run at the specified start time
	const firstJob = setTimeout(runJob, startTime.diff(moment()));
	scheduledJobs[jobName] = [firstJob];
};

module.exports = { scheduleJobsByDay, scheduleJobByInterval, scheduledJobs };