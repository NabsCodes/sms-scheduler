const axios = require('axios');
const generateMessages = require('../messages');
const events = require('../utils/events');
require('dotenv').config();

const sendSMS = async (destination, source) => {
	const now = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }); // Get the current date and timezone
	const date = new Date(now); // Create a new date object
	const hour = `${date.getHours()}`.padStart(2, 0); // Get the current hour and pad it with 0 if it's less than 10
	const min = `${date.getMinutes()}`.padStart(2, 0); // Get the current minute and pad it with 0 if it's less than 10
	const time = `${hour}:${min}`; // Get the current time

	const { montyMessages } = generateMessages();
	const username = process.env.MONTY_USERNAME;
	const password = process.env.MONTY_PASSWORD;
	try {
		const response = await axios.post('https://httpsmsc05.montymobile.com/HTTP/api/Client/SendSMS',
			{
				destination: destination,
				source: source,
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
			console.log(`SMS delivered successfully at ${time}`);
			events.emit('messageSent', { message: `SMS delivered successfully at ${time}` });
		} else {
			console.log(`Server error when sending message: ${response.data}`);
			events.emit('messageError', { error: `Server error: Failed to send SMS. Response data: ${response.data}` });
		}

	} catch (error) {
		console.error(`Error when sending message: ${error}`);
		events.emit('messageError', { error: 'Error: Failed to send SMS. Please check the SMS API and try again.' });
	}
};

module.exports = sendSMS;