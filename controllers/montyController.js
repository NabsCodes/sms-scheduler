const { v4: uuidv4 } = require('uuid');
const { scheduleJobByInterval, scheduledJobs } = require('../utils/scheduleJob');
const sendSMS = require('../api/montyApi');
const MontySms = require('../models/montySms');
const getCurrentTime = require('../utils/getCurrentTime');
const moment = require('moment-timezone');

// This function is used to render the schedule page
const renderSchedule = async (req, res) => {
	try {
		// Find all scheduled SMS
		const scheduledSms = await MontySms.find();
		// Find all active and inactive jobs and count them respectively
		const activeJobs = await MontySms.countDocuments({ status: 'Active' });
		const inactiveJobs = await MontySms.countDocuments({ status: 'Inactive' });
		// Render the monty page with the scheduled SMS
		res.render('pages/monty', {
			scheduledSms,
			activePage: 'MontyMobile',
			title: 'MontyMobile',
			isHomepage: false,
			activeJobs,
			inactiveJobs,
		});
	} catch (error) {
		// Log the error and flash an error message and redirect to the monty page
		console.error('Error Fetching Scheduled SMS:', error.message);
		req.flash('error', 'There was an error rendering MontyMobile Page. Please try again later.');
		return res.status(500).redirect('/');
	}
};

// This function is used to render the send page
const renderSend = (_req, res) => {
	// Render the send page
	res.render('pages/montySendSMS', {
		activePage: 'MontyMobile',
		title: 'Monty Test SMS',
		isHomepage: false,
	});
};

// This function is used to send SMS immediately
const sendNow = async (req, res) => {
	try {
		// Get the current time
		const time = getCurrentTime();
		// Destructure the request body
		const { title, message } = req.body;

		// Check if the title and message are empty
		if (!title || !message) {
			req.flash('error', 'Title and message are required');
			return res.status(400).redirect('/monty/sendnow');
		}

		// Split the phone numbers and remove whitespace
		const phoneNumbers = message.split(',').map((item) => item.trim());

		// Validate the phone numbers
		for (const phoneNumber of phoneNumbers) {
			if (!/^234\d{10}$/.test(phoneNumber)) {
				// Flash an error message and redirect if the phone numbers are invalid
				req.flash('error', 'Enter valid Nigerian numbers, separated by commas. Numbers should start with 234 and be 13 digits long.');
				return res.status(400).redirect('/monty/sendnow');
			}
		}

		// Check for duplicate phone numbers
		const checkDuplicateNum = new Set(phoneNumbers);
		if (checkDuplicateNum.size !== phoneNumbers.length) {
			// Flash an error message and redirect if there are duplicate phone numbers
			req.flash('error', 'Duplicate phone numbers are not allowed');
			return res.status(400).redirect('/monty/sendnow');
		}

		try {
			// Try to send the SMS
			await sendSMS(message, title);
			// If successful, flash a success message and redirect to the success page
			req.flash('success', `SMS delivered successfully at ${time}`);
			return res.status(200).redirect('/monty/sendnow');
		} catch (error) {
			// If an error occurs, flash an error message and redirect the error
			req.flash('error', error.message);
			return res.status(500).redirect('/monty/sendnow');
		}
	} catch (err) {
		// Log the error and flash an error message and redirect to the send page
		console.error('Error Sending SMS:', err);
		req.flash('error', 'There was an error sending the SMS. Please try again later.');
		return res.status(500).redirect('/monty/sendnow');
	}
};

// This function is used to schedule tasks
const scheduleTask = async (req, res) => {
	try {
		// Destructure the request body
		let { date, interval, startTime, runCount, title, email, message } = req.body;
		runCount = Number(runCount);
		// Log the received data
		console.log(date, interval, startTime, runCount, title, email, message);

		// Validate the received data
		if (!date || interval === undefined || !startTime || isNaN(runCount) || title === undefined || !message) {
			// Flash an error message and redirect if the data is invalid
			req.flash('error', 'Please fill in all fields correctly');
			return res.status(400).redirect('/monty');
		} else {
			// Check the number of currently scheduled tasks
			const scheduledTaskCount = await MontySms.countDocuments();

			// Check if the maximum number of tasks is already scheduled
			if (scheduledTaskCount >= 20) {
				// Flash an error message and redirect if the maximum number of tasks is already scheduled
				req.flash('error', 'Maximum number of scheduled tasks reached delete any schedulesms');
				return res.status(400).redirect('/monty');
			}

			// Split the phone numbers and remove whitespace
			const phoneNumbers = message.split(',').map((item) => item.trim());

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
			const [startHour, startMinute] = startTime.split(':').map((item) => Number(item));

			// Convert the date and start time to a moment object in Africa/Lagos timezone
			const taskDateTime = moment.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

			// Get the current date and time in Africa/Lagos timezone
			const currentDateTime = moment.tz('Africa/Lagos');

			// Check if the task date and time is in the past
			if (taskDateTime.isBefore(currentDateTime)) {
				// Flash an error message if the task date and time is in the past
				req.flash('error', 'Cannot schedule a task in the past or present please select a future date and time');
				return res.status(400).redirect('/monty');
			} else {
				// Receivers are the phone numbers from the message
				const receivers = message;

				// Generate a unique job name
				const jobName = uuidv4();

				// Check if a task with the date, start time, end time, and interval already exists
				const existingTask = await MontySms.findOne({
					date,
					startTime,
					runCount,
					status: 'Active',
					interval,
				});
				if (existingTask) {
					// Flash an error message and redirect if a task with the same time already exists
					req.flash('error', 'A task is already scheduled for this time and interval or overlaps with the runcount');
					return res.status(400).redirect('/monty');
				}

				// Schedule the tasks
				scheduleJobByInterval(email, jobName, date, startHour, startMinute, interval, runCount, receivers, title, MontySms);

				// Create a new scheduled SMS
				const scheduledSms = new MontySms({
					jobName,
					date,
					interval,
					startTime,
					runCount,
					senderId: title,
					email,
					receivers,
					status: 'Active',
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
			req.flash('error', 'Scheduled SMS not found');
			return res.status(404).redirect('/monty');
		}

		// Cancel all jobs with the same base job name
		const jobName = scheduledSms.jobName;
		const jobs = scheduledJobs[jobName];
		if (jobs) {
			jobs.forEach((job) => clearTimeout(job));
			delete scheduledJobs[jobName];
			console.log(`Job ${jobName} cancelled and deleted`);
		}

		// Delete the MontySms document
		const deletedSms = await MontySms.findByIdAndDelete(id);
		if (!deletedSms) {
			// Flash an error message and redirect if the MontySms document is not deleted
			req.flash('error', 'Failed to delete MontySms document');
			return res.status(500).redirect('/monty');
		}

		// Flash a success message and redirect to the monty page
		req.flash('success', 'Successfully deleted a task!');
		return res.status(200).redirect('/monty');
	} catch (err) {
		// Log the error and flash an error message and redirect to the monty page
		console.error('Error Deleting Task:', err.message);
		req.flash('error', 'There was an error deleting your tasks. Please try again later.');
		return res.status(500).redirect('/monty');
	}
};

module.exports = {
	renderSchedule,
	renderSend,
	sendNow,
	scheduleTask,
	deleteTask,
};
