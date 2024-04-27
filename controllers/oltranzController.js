const { v4: uuidv4 } = require('uuid');
const schedule = require('node-schedule');
const { scheduleJobsByDay } = require('../utils/scheduleJob');
const OltranzSms = require('../models/oltranzSms');

// Render the schedule page
const renderSchedule = async (_req, res) => {
	const scheduledSms = await OltranzSms.find();
	res.render('oltranz', {
		scheduledSms,
		activePage: 'Oltranz',
		title: 'Oltranz',
		isHomepage: false
	});
};

// Schedule a task
const scheduleTask = async (req, res) => {
	try {
		let { day, interval, startTime, endTime, title, message } = req.body;
		// console.log(day, interval, startTime, endTime, title, message);

		day = Array.isArray(day) ? day : [day]; // Ensure day is an array, whether it was originally a string or an array
		title = Array.isArray(title) ? title : [title]; // Ensure title is an array, whether it was originally a string or an array

		if (day === undefined || interval === undefined || !startTime || !endTime || title === undefined || !message) {
			req.flash('error', 'Please fill in all fields correctly');
			return res.status(400).redirect('/oltranz');
		} else if (startTime >= endTime) {
			req.flash('error', 'Start time must be before end time');
			return res.status(400).redirect('/oltranz');
		} else {
			const phoneNumbers = message.split(',').map(item => item.trim()); // Split the phone numbers and remove whitespace

			// Check if the phone numbers are valid
			for (const phoneNumber of phoneNumbers) {
				if (!/^234\d{10}$/.test(phoneNumber)) {
					req.flash('error', 'Enter valid Nigerian numbers, separated by commas. Numbers should start with 234 and be 13 digits long.');
					return res.status(400).redirect('/oltranz');
				}
			}

			const checkDuplicateNum = new Set(phoneNumbers); // Check for duplicate phone numbers
			if (checkDuplicateNum.size !== phoneNumbers.length) {
				req.flash('error', 'Duplicate phone numbers are not allowed');
				return res.status(400).redirect('/oltranz');
			}

			const [startHour, startMinute] = startTime.split(':').map(item => Number(item)); // Split the start time to hours and minutes
			const [endHour, endMinute] = endTime.split(':').map(item => Number(item)); // Split the end time to hours and minutes

			const startMinutes = startHour * 60 + startMinute;  // Convert the start time to minutes
			const endMinutes = endHour * 60 + endMinute;  // Convert the end time to minutes
			const duration = endMinutes - startMinutes;  // Calculate the duration of the task in minutes

			// Check if the interval is greater than the duration of the task
			if (interval > duration) {
				req.flash('error', 'Interval cannot be greater than the duration');
			} else {
				const receivers = message.split(',').map(item => item.trim()); // Split the phone numbers and remove whitespace

				const jobName = uuidv4(); // Generate a unique job name

				// Check if a task with the same time already exists
				const existingTask = await OltranzSms.findOne({ day, startTime, endTime });
				if (existingTask) {
					req.flash('deleteError', 'A task is already scheduled for this time');
					return res.status(400).redirect('/oltranz');
				}

				scheduleJobsByDay(jobName, day, startHour, startMinute, receivers, title); // Schedule the first task

				// Schedule the remaining tasks if there is an interval
				if (interval) {
					const intervalMinutes = Number(interval);
					let nextMinutes = startMinutes + intervalMinutes; // Calculate the next task time

					while (nextMinutes < endMinutes) {
						const nextHour = Math.floor(nextMinutes / 60);
						const nextMinute = nextMinutes % 60;

						scheduleJobsByDay(jobName, day, nextHour, nextMinute, receivers, title);

						nextMinutes += intervalMinutes; // Calculate the next task time
					}
				}

				// Schedule the last task if the interval does not divide the duration evenly
				scheduleJobsByDay(jobName, day, endHour, endMinute, receivers, title);

				const scheduledSms = new OltranzSms({
					jobName,
					day: day.map(item => item.trim()), // Save the current day
					interval,
					startTime,
					endTime,
					senderId: title.map(item => item.trim()), // Save the current title
					receivers, // Save the receivers
					status: 'Active'
				});

				await scheduledSms.save();

				req.flash('success', 'Tasks Scheduled!');
			}
		}

		return res.status(200).redirect('/oltranz');
	} catch (err) {
		console.error('Error Scheduling Tasks:', err.message);
		req.flash('error', 'There was an error scheduling your tasks. Please try again later.');
		return res.status(500).redirect('/oltranz');
	}
};

// Delete a task
const deleteTask = async (req, res, _next) => {
	try {
		const { id } = req.params;
		const scheduledSms = await OltranzSms.findById(id);
		if (!scheduledSms) {
			req.flash('deleteError', 'Scheduled SMS not found');
			return res.status(404).redirect('/oltranz');
		}

		// Cancel the scheduled job
		const job = schedule.scheduledJobs[scheduledSms.jobName];
		if (job) {
			job.cancel();
		}

		// Delete the OltranzSms document
		const deletedSms = await OltranzSms.findByIdAndDelete(id);
		if (!deletedSms) {
			throw new Error('Failed to delete OltranzSms document');
		}

		req.flash('deleteSuccess', 'Successfully deleted a task!');
		return res.status(200).redirect('/oltranz');
	} catch (err) {
		console.error('Error Deleting Task:', err.message);
		req.flash('deleteError', 'There was an error deleting your tasks. Please try again later.');
		return res.status(500).redirect('/oltranz');
	}
};

module.exports = { renderSchedule, scheduleTask, deleteTask };