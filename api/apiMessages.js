const getCurrentTime = require('../utils/getCurrentTime');

const generateMessages = () => {
	// Get the current time
	const time = getCurrentTime();

	// Define the messages to be sent by Oltanz API
	const oltranzMessages = [
		{
			"message": `Your verification code is ${time}`,
			"title": "JAIZ BANK"
		},
		{
			"message": `Dear Customer Your OTP Password is ${time}`,
			"title": "PROVIDUS"
		},
		{
			"message": `Your OTP Pin is ${time}`,
			"title": "PAYREP"
		}
	];

	// Define the messages to be sent by Monty API
	const montyMessages = [
		{
			// "destination": "2348033531332,2348122353161",
			// "source": "JAIZ BANK",
			"text": `Your OTP code is ${time}`,
		}
	];

	return { oltranzMessages, montyMessages };
};

module.exports = generateMessages;
