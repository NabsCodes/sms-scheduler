const generateMessages = () => {
	const now = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }); // Get the current date and timezone
	const date = new Date(now); // Create a new date object
	const hour = `${date.getHours()}`.padStart(2, 0); // Get the current hour and pad it with 0 if it's less than 10
	const min = `${date.getMinutes()}`.padStart(2, 0); // Get the current minute and pad it with 0 if it's less than 10

	const time = `${hour}:${min}`; // Get the current time

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
