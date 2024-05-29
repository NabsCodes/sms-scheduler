const moment = require('moment-timezone');
const sendSMS = require('../api/montyApi');

// Object to store scheduled jobs 
const scheduledJobs = {};

// Schedule a job by interval
const scheduleJobByInterval = (email, jobName, date, startHour, startMinute, interval, runCount, destination, source, model) => {
	let count = 0; // Initialize the count of job runs

	const startTime = moment.tz(`${date} ${startHour}:${startMinute}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

	// Function to run the job and send SMS
	const jobFunction = async () => {
		console.log(`Running job ${jobName} at ${moment.tz('Africa/Lagos').format("dddd, MMMM Do YYYY, h:mm:ss a")}`);
		try {
			// Check if the email is not an empty string
			if (email !== '') {
				await sendSMS(destination, source, email);
			} else {
				// Send SMS only
				await sendSMS(destination, source);
			}
			// Update the run count completed in the database
			await model.findOneAndUpdate({ jobName }, { $inc: { runCountCompleted: 1 } });

			count++; // Increment count only on successful execution
		} catch (error) {
			console.error(`Error running job ${jobName}:`, error.message);
		}
	};

	// Function to schedule the next job
	const scheduleNextJob = async () => {
		if (count < runCount) {
			const nextJob = setTimeout(async () => {
				await jobFunction();
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
			scheduleNextJob();
		} catch (error) {
			console.error(`Error in runJob for ${jobName}:`, error);
		}
	};

	// Schedule the first job to run at the specified start time
	const firstJob = setTimeout(runJob, startTime.diff(moment()));
	scheduledJobs[jobName] = [firstJob];
};

module.exports = { scheduleJobByInterval, scheduledJobs };