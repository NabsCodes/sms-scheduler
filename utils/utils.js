const axios = require('axios');
const schedule = require('node-schedule');
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
		console.error(`Error getting token: ${error}`);
		throw error;
	}
};

let counter = 0; // Define counter outside of the function

const sendBulkSMS = async (token, message) => {
	try {
		const response = await axios.post('https://sms.api.oltranz.com/api/v1/sms/send', {
			receivers: message.receivers,
			message: message.message,
			title: message.title
		}, {
			headers: { 'Authorization': `Bearer ${token}` }
		});

		// console.log(response.data);

		if (response.data.statusCode === 200) {
			counter++;
			console.log(`Message sent successfully. Total messages sent: ${counter}`);
		} else {
			console.error(`Error sending message: ${response.data.message}`);
		}

	} catch (error) {
		console.error(`Error sending message: ${error}`);
	}
};

const getTokenAndSendMessages = async (receivers, title, multiple = false) => {
	try {
		const token = await getToken(); // Get the token
		let messages;
		if (multiple) {
			messages = predefinedMessages.map(msg => ({ ...msg, receivers })); // Send all messages
		} else {
			const messageObj = predefinedMessages.find(msg => msg.title === title); // Find the message that matches the selected title
			messages = messageObj ? [{ ...messageObj, receivers }] : []; // Send only the selected message
		}
		for (const message of messages) {
			await sendBulkSMS(token, message); // Send each message
		}
	} catch (err) {
		console.error('Error sending messages:', err);
	}
};

const scheduleJob = (jobName, day, hour, minute, receivers, titles) => {
	return schedule.scheduleJob(jobName, { dayOfWeek: day, hour, minute }, async function () {
		for (const title of titles) {
			await getTokenAndSendMessages(receivers, title);
		}
	});
};

const checkAndUpdateTaskStatus = async (scheduledSms) => {
	const currentTime = new Date();
	const endTime = new Date();
	const [endHour, endMinute] = scheduledSms.endTime.split(':').map(Number);
	endTime.setHours(endHour, endMinute);

	if (currentTime >= endTime) {
		await ScheduledSms.findByIdAndUpdate(scheduledSms._id, { status: 'Inactive' });
	}
};

setInterval(async () => {
	const scheduledSmsList = await ScheduledSms.find({ status: 'Active' });
	for (const scheduledSms of scheduledSmsList) {
		await checkAndUpdateTaskStatus(scheduledSms);
	}
}, 60 * 1000);


module.exports = { scheduleJob, getTokenAndSendMessages };