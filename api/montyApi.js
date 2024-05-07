const axios = require('axios');
const util = require('util');
const generateMessages = require('./apiMessages');
const events = require('../utils/events');
const getCurrentTime = require('../utils/getCurrentTime');
require('dotenv').config();

// Send SMS using Monty API
const sendSMS = async (destination, source) => {
	// Get the current time
	const time = getCurrentTime();
	// Generate messages
	const { montyMessages } = generateMessages();
	// Get the Monty API username and password from the environment variables
	const username = process.env.MONTY_USERNAME;
	const password = process.env.MONTY_PASSWORD;
	try {
		const response = await axios.post('https://httpsmsc05.montymobile.com/HTTP/api/Client/SendSMS',
			{
				destination,
				source,
				text: montyMessages[0].text,
				dataCoding: 0
			},
			{
				headers: {
					'Content-Type': 'application/json', // Specify the type of data
					'Username': username,
					'Password': password
				}
			});
		// console.log(response.data);
		if (response.data.ErrorDescription === 'Ok') {
			console.log(`SMS delivered successfully: ${montyMessages[0].text}`);
			events.emit('messageSent', { message: `SMS delivered successfully: ${montyMessages[0].text}` });
		} else {
			const sanitizedData = util.inspect(response.data);
			console.log(`Server error when sending message: ${sanitizedData}`);
			events.emit('messageError', { error: `Server error: Failed to send SMS. Response data: ${sanitizedData}` });
			throw new Error(`Server error: Failed to send SMS. Response data: ${sanitizedData}`);
		}

	} catch (error) {
		console.error(`Error when sending message: ${error}`);
		events.emit('messageError', { error: 'Error: Failed to send SMS. Please check the SMS API and try again.' });
		throw error;
	}
};

module.exports = sendSMS;