const axios = require('axios');
const schedule = require('node-schedule');
const { predefinedMessages } = require('./messages');

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

const sendBulkSMS = async (token, message) => {
	try {
		const response = await axios.post('https://sms.api.oltranz.com/api/v1/sms/send', {
			receivers: message.receivers,
			message: message.message,
			title: message.title
		}, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		// let counter = 0; //database.successMessages
		console.log(response.data);
		// let statusCode = response.data.statusCode;
		// console.log("This is status code: ", statusCode);
		// if (statusCode === 200) {
		// 	counter++;
		// 	console.log("Message sent successfully", counter);
		// let messagesSent = 

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

const scheduleJob = (day, hour, minute, receivers, title) => {
	return schedule.scheduleJob({ dayOfWeek: day, hour, minute }, async function () {
		getTokenAndSendMessages(receivers, title);
	});
};

module.exports = { getToken, sendBulkSMS, getTokenAndSendMessages, scheduleJob };