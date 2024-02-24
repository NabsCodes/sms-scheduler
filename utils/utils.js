const axios = require('axios');
const schedule = require('node-schedule');
const events = require('./events');
const predefinedMessages = require('../messages');

const ScheduledSms = require('../models/scheduledSms');

const getToken = async () => {
	try {
		const response = await axios.post('https://auth.oltranz.com/auth/realms/api/protocol/openid-connect/token', {
			username: process.env.USERNAME,
			grant_type: 'password',
			client_id: process.env.CLIENT_ID,
			password: process.env.PASSWORD
		}, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});

		return response.data.access_token;
	} catch (error) {
		console.error(`Network error when getting token: ${error}`);
		events.emit('messageError', { error: "Network error: Can't authenticate token. Please check your connection and try again." });
		throw error;
	}
};

const sendBulkSMS = async (token, message) => {
	try {
		const response = await axios.post('https://sms.api.oltranz.com/api/v1/sms/send', {
			receivers: message.receivers,
			message: message.message,
			title: message.title
		}, {
			headers: { 'Authorization': `Bearer ${token}` }
		});

		if (response.data.statusCode === 200) {
			console.log('SMS delivered successfully!');
			events.emit('messageSent', { message: 'SMS delivered successfully!' });
		} else {
			console.error(`Server error when sending message: ${response.data}`);
			events.emit('messageError', { error: `Server error: Failed to send SMS. Response data: ${response.data}` });
		}

	} catch (error) {
		console.error(`Error when sending message: ${error}`);
		events.emit('messageError', { error: 'Error: Failed to send SMS. Please check the SMS API and try again.' });
	}
};

const getTokenAndSendMessages = async (jobName, receivers, title, multiple = false) => {
	try {
		const token = await getToken(); // Get the token
		if (!token) {
			throw new Error('Failed to retrieve token');
		}
		let messages;
		if (multiple) {
			messages = predefinedMessages.map(msg => ({ ...msg, receivers })); // Send all messages
		} else {
			const messageObj = predefinedMessages.find(msg => msg.title === title); // Find the message that matches the selected title
			messages = messageObj ? [{ ...messageObj, receivers }] : []; // Send only the selected message
		}
		for (const message of messages) {
			// Check if the job has been cancelled
			const job = schedule.scheduledJobs[jobName];
			if (!job) {
				break;
			}

			await sendBulkSMS(token, message); // Send each message
		}
	} catch (error) {
		console.error('Error sending messages:', error);
		events.emit('messageError', { error: 'Error occurred while trying to send messages. Please check the message content, receivers, and your scheduled jobs.' });
	}
};

const scheduleJob = (jobName, day, hour, minute, receivers, titles) => {
	return schedule.scheduleJob(jobName, { dayOfWeek: day, hour, minute, tz: 'Africa/Lagos' }, async () => {
		for (const title of titles) {
			await getTokenAndSendMessages(jobName, receivers, title);
		}
	});
};

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

setInterval(async () => {
	const scheduledSmsList = await ScheduledSms.find({ status: 'Active' });
	for (const scheduledSms of scheduledSmsList) {
		await checkAndUpdateTaskStatus(scheduledSms);
	}
});


module.exports = { scheduleJob, getTokenAndSendMessages };