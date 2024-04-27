const { v4: uuidv4 } = require('uuid');
const { scheduleJobByInterval, scheduledJobs } = require('../utils/scheduleJob');
const sendSMS = require('../api/montyApi');
const MontySms = require('../models/montySms');
const getCurrentTime = require('../utils/getCurrentTime');
const moment = require('moment-timezone');
const schedule = require('node-schedule');

// This function is used to render the schedule page
const renderSchedule = async (_req, res) => {
	// Find all scheduled SMS
	const scheduledSms = await MontySms.find();
	// Render the monty page with the scheduled SMS
	res.render('monty', {
		scheduledSms,
		activePage: 'MontyMobile',
		title: 'MontyMobile',
		isHomepage: false
	});
};

// This function is used to render the send page
const renderSend = async (_req, res) => {
	// Render the send page
	res.render('montySendSMS', {
		activePage: 'MontyMobile',
		title: 'Monty Test SMS',
		isHomepage: false
	});
};

// This function is used to send SMS immediately
const sendNow = async (req, res) => {
	try {
		// Get the current time
		const time = getCurrentTime();
		// Destructure the request body
		let { title, message } = req.body;

		// Check if the title and message are empty
		if (!title || !message) {
			req.flash('error', 'Title and message are required');
			return res.status(400).redirect('/monty/sendnow');
		}

		// Send the SMS and flash a success message
		await sendSMS(message, title);
		req.flash('success', `SMS delivered successfully at ${time}`);
		return res.status(200).redirect('/monty/sendnow');
	} catch (err) {
		// Log the error and flash an error message and redirect to the send page
		console.error('Error Sending SMS:', err);
		req.flash('error', 'There was an error sending the SMS. Please try again later.');
		return res.status(500).redirect('/monty/sendnow');
	}
};

// second (0-59)
// minute (0-59)
// hour (0-23)
// date (1-31)
// month (0-11)
// year
// dayOfWeek (0-6) Starting with Sunday
// tz

// This function is used to schedule tasks
const scheduleTask = async (req, res) => {
	try {
		// Destructure the request body
		// let { date, interval, startTime, endTime, title, message } = req.body;
		// startTime = moment.tz(startTime, 'HH:mm', 'Africa/Lagos').format('HH:mm');
		// endTime = moment.tz(endTime, 'HH:mm', 'Africa/Lagos').format('HH:mm');
		// date = moment(date).format('YYYY-MM-DD');
		// let dayOfWeek = moment(date).day();
		// console.log(dayOfWeek);
		// // Log the received data
		// // console.log(date, interval, startTime, endTime, title, message);

		let { date, interval, startTime, endTime, title, message } = req.body;
		console.log(date, interval, startTime, endTime, title, message);

		// Convert the date and times to moment objects
		let startDate = moment.tz(date, 'YYYY-MM-DD', 'Africa/Lagos');
		let startTimeMoment = moment.tz(startTime, 'HH:mm', 'Africa/Lagos');
		let endTimeMoment = moment.tz(endTime, 'HH:mm', 'Africa/Lagos');

		// Extract the various components
		let second = startTimeMoment.seconds();
		let minute = startTimeMoment.minutes();
		let hour = startTimeMoment.hours();
		let dayOfMonth = startDate.date();
		let month = startDate.month();
		let year = startDate.year();
		let dayOfWeek = startDate.day();

		console.log(second, minute, hour, dayOfMonth, month, year, dayOfWeek);

		// Create a cron-style schedule rule
		let rule = `*/${interval} * * * *`;

		// Define the job function
		const jobFunction = () => {
			console.log(`Running job ${title} at ${moment.tz('Africa/Lagos').format()}`);
		};

		// Convert the start and end times to ISO 8601 strings
		let startTimeISO = startTimeMoment.format();
		console.log(startTimeISO);
		let endTimeISO = endTimeMoment.format();
		console.log(endTimeISO);

		// Schedule the job to start at the start time, end at the end time, and recur according to the rule
		let job = schedule.scheduleJob({ start: new Date(startTimeISO), end: new Date(endTimeISO), rule: rule }, jobFunction);

		// Validate the received data
		if (!date || interval === undefined || !startTime || !endTime || title === undefined || !message) {
			// Flash an error message and redirect if the data is invalid
			req.flash('error', 'Please fill in all fields correctly');
			return res.status(400).redirect('/monty');
		} else if (startTime >= endTime) {
			// Flash an error message and redirect if the start time is not before the end time
			req.flash('error', 'Start time must be before end time');
			return res.status(400).redirect('/monty');
		} else {
			// Check the number of currently scheduled tasks
			const scheduledTaskCount = await MontySms.countDocuments();

			if (scheduledTaskCount >= 20) {
				// Flash an error message and redirect if the maximum number of tasks is already scheduled
				req.flash('deleteError', 'Maximum number of scheduled tasks reached delete any schedulesms');
				return res.status(400).redirect('/monty');
			}

			// Split the phone numbers and remove whitespace
			const phoneNumbers = message.split(',').map(item => item.trim());

			// Validate the phone numbers
			for (const phoneNumber of phoneNumbers) {
				if (!/^234\d{10}$/.test(phoneNumber)) {
					// Flash an error message and redirect if the phone numbers are invalid
					req.flash('error', 'Enter valid Nigerian numbers, separated by commas. Numbers should start with 234 and be 13 digits long.');
					return res.status(400).redirect('/monty');
				}
			}

			// Check for duplicate phone numbers
			const checkDuplicateNum = new Set(phoneNumbers);
			if (checkDuplicateNum.size !== phoneNumbers.length) {
				// Flash an error message and redirect if there are duplicate phone numbers
				req.flash('error', 'Duplicate phone numbers are not allowed');
				return res.status(400).redirect('/monty');
			}

			// Split the start time to hours and minutes
			const [startHour, startMinute] = startTime.split(':').map(item => Number(item));
			// Split the end time to hours and minutes
			const [endHour, endMinute] = endTime.split(':').map(item => Number(item));

			// Convert the start time to minutes
			const startMinutes = startHour * 60 + startMinute;
			// Convert the end time to minutes
			const endMinutes = endHour * 60 + endMinute;
			// Calculate the duration of the task in minutes
			const duration = endMinutes - startMinutes;

			// Convert the date and start time to a moment object in Africa/Lagos timezone
			const taskDateTime = moment.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

			// Get the current date and time in Africa/Lagos timezone
			const currentDateTime = moment.tz('Africa/Lagos');

			// Check if the task date and time is in the past
			if (taskDateTime.isBefore(currentDateTime)) {
				// Flash an error message if the task date and time is in the past
				req.flash('error', 'Cannot schedule a task in the past or present please select a future date and time');
				return res.status(400).redirect('/monty');
			}

			// Check if the interval is greater than the duration of the task
			if (interval > duration) {
				// Flash an error message if the interval is greater than the duration
				req.flash('error', 'Interval cannot be greater than the duration');
				return res.status(400).redirect('/monty');
			} else {
				// Receivers are the phone numbers from the message
				const receivers = message;

				// Generate a unique job name
				const jobName = uuidv4();

				// Check if a task with the date, start time, end time, and interval already exists
				const existingTask = await MontySms.findOne({ date, startTime, endTime, status: 'Active', interval });
				// const existingTask = await MontySms.findOne({
				// 	date,
				// 	status: 'Active',
				// 	$or: [
				// 		{ startTime: { $lte: endTime }, endTime: { $gte: startTime } }, // Overlaps with the new task
				// 		{ startTime: { $lte: startTime }, endTime: { $gte: endTime } }  // Contains the new task
				// 	]
				// });
				if (existingTask) {
					// Flash an error message and redirect if a task with the same time already exists
					req.flash('deleteError', 'A task is already scheduled for this time or overlaps with the new task');
					return res.status(400).redirect('/monty');
				}

				// Schedule the tasks
				scheduleJobByInterval(jobName, date, startHour, startMinute, interval, endHour, endMinute, receivers, title);

				// Create a new scheduled SMS
				const scheduledSms = new MontySms({
					jobName,
					date: date,
					interval,
					startTime,
					endTime,
					senderId: title,
					receivers: receivers,
					status: 'Active'
				});

				// Save the scheduled SMS
				await scheduledSms.save();

				// Flash a success message
				req.flash('success', 'Tasks Scheduled!');
			}
		}

		return res.status(200).redirect('/monty');
	} catch (err) {
		// Log the error and flash an error message and redirect to the monty page
		console.error('Error Scheduling Tasks:', err);
		req.flash('error', 'There was an error scheduling your tasks. Please try again later.');
		return res.status(500).redirect('/monty');
	}
};

// This function is used to delete tasks
const deleteTask = async (req, res, _next) => {
	try {
		// Get the id from the request parameters
		const { id } = req.params;
		// Find the scheduled SMS by id
		const scheduledSms = await MontySms.findById(id);
		if (!scheduledSms) {
			// Flash an error message and redirect if the scheduled SMS is not found
			req.flash('deleteError', 'Scheduled SMS not found');
			return res.status(404).redirect('/monty');
		}

		// Cancel all jobs with the same base job name
		const jobName = scheduledSms.jobName;
		const job = scheduledJobs[jobName];
		if (job) {
			job.stop();
			delete scheduledJobs[jobName];
			console.log(`Job ${jobName} cancelled and deleted`);
		}

		// Delete the MontySms document
		const deletedSms = await MontySms.findByIdAndDelete(id);
		if (!deletedSms) {
			// Flash an error message and redirect if the MontySms document is not deleted
			req.flash('deleteError', 'Failed to delete MontySms document');
			return res.status(500).redirect('/monty');
		}

		// Flash a success message and redirect to the monty page
		req.flash('deleteSuccess', 'Successfully deleted a task!');
		return res.status(200).redirect('/monty');
	} catch (err) {
		// Log the error and flash an error message and redirect to the monty page
		console.error('Error Deleting Task:', err.message);
		req.flash('deleteError', 'There was an error deleting your tasks. Please try again later.');
		return res.status(500).redirect('/monty');
	}
};

module.exports = { renderSchedule, renderSend, sendNow, scheduleTask, deleteTask };