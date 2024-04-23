const { v4: uuidv4 } = require('uuid');
const { scheduleJobByInterval, scheduledJobs } = require('../utils/scheduleJob');
const MontySms = require('../models/montySms');

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

// This function is used to schedule tasks
const scheduleTask = async (req, res) => {
	try {
		// Destructure the request body
		let { date, interval, startTime, endTime, title, message } = req.body;
		// Log the received data
		// console.log(date, interval, startTime, endTime, title, message);

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

			// Check if the interval is greater than the duration of the task
			if (interval > duration) {
				// Flash an error message if the interval is greater than the duration
				req.flash('error', 'Interval cannot be greater than the duration');
			} else {
				// Receivers are the phone numbers from the message
				const receivers = message;
				console.log(receivers);

				// Generate a unique job name
				const jobName = uuidv4();

				// Check if a task with the same time already exists
				const existingTask = await MontySms.findOne({ date, startTime, endTime });
				if (existingTask) {
					// Flash an error message and redirect if a task with the same time already exists
					req.flash('deleteError', 'A task is already scheduled for this time');
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

module.exports = { renderSchedule, scheduleTask, deleteTask };