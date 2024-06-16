const axios = require('axios');
const util = require('util');
const generateMessages = require('./apiMessages');
const events = require('../utils/events');
const successEmail = require('../services/successMessageEmail');
const errorEmail = require('../services/errorMessageEmail');
require('dotenv').config();

// Send SMS using Monty API
const sendSMS = async (destination, source, email = '') => {
	// Generate messages
	const { montyMessages } = generateMessages();
	// Get the Monty API username and password from the environment variables
	const username = process.env.MONTY_USERNAME;
	const password = process.env.MONTY_PASSWORD;
	try {
		const response = await axios.post(
			'https://httpsmsc05.montymobile.com/HTTP/api/Client/SendSMS',
			{
				destination,
				source,
				text: montyMessages[0].text,
				dataCoding: 0,
			},
			{
				headers: {
					'Content-Type': 'application/json', // Specify the type of data
					Username: username,
					Password: password,
				},
			},
		);
		// console.log(response.data);
		if (response.data.ErrorDescription === 'Ok') {
			console.log(`SMS delivered successfully: ${montyMessages[0].text}`);
			// Emit a message sent event
			events.emit('messageSent', {
				message: `SMS delivered successfully: ${montyMessages[0].text}`,
			});
			// Send a success email to the user
			if (email) {
				try {
					await successEmail(email, 'SMS Delivered Successfully', `${montyMessages[0].text}`, destination);
				} catch (error) {
					console.error(`Error sending success email: ${error}`);
				}
			}
		} else {
			const sanitizedData = util.inspect(response.data);
			console.log(`Server error when sending message: ${sanitizedData}`);
			throw new Error(`Server error: Failed to send SMS. Please check the SMS API and try again.`);
		}
	} catch (error) {
		console.error(`Error when sending message: ${error}`);
		// Emit a message error event
		events.emit('messageError', {
			error: 'Error: Failed to send SMS. Please check the SMS API and try again.',
		});
		// Send an error email to the user
		if (email) {
			try {
				await errorEmail(email, 'Error Sending SMS', `${error.message}`, destination);
			} catch (error) {
				console.error(`Error sending error email: ${error}`);
			}
		}
		throw error;
	}
};

module.exports = sendSMS;
