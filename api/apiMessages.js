const getCurrentTime = require('../utils/getCurrentTime');

const generateMessages = () => {
	// Get the current time
	const time = getCurrentTime();

	// Define the messages to be sent by Monty API
	const montyMessages = [
		{
			"text": `Your OTP code is ${time}`,
		}
	];

	return { montyMessages };
};

module.exports = generateMessages;
