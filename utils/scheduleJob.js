const schedule = require('node-schedule');
const { getTokenAndSendMessages } = require('./smsApi');

// Schedule a job
const scheduleJob = (jobName, day, hour, minute, receivers, titles) => {
	return schedule.scheduleJob(jobName, { dayOfWeek: day, hour, minute, tz: 'Africa/Lagos' }, async () => {
		for (const title of titles) {
			await getTokenAndSendMessages(jobName, receivers, title);
		}
	});
};

// Schedule multiple jobs
const scheduleJobs = (jobName, days, hour, minute, receivers, title) => {
	days.forEach(d => scheduleJob(jobName, d, hour, minute, receivers, title));
};

module.exports = { scheduleJob, scheduleJobs };