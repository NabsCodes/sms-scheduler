// Export a function that returns the current time in the specified timezone
function getCurrentTime(timeZone = "Africa/Lagos") {
	const now = new Date().toLocaleString("en-US", { timeZone }); // Get the current date and timezone
	const date = new Date(now); // Create a new date object
	const hour = `${date.getHours()}`.padStart(2, 0); // Get the current hour and pad it with 0 if it's less than 10
	const min = `${date.getMinutes()}`.padStart(2, 0); // Get the current minute and pad it with 0 if it's less than 10
	return `${hour}:${min}`; // Get the current time
}

module.exports = getCurrentTime;