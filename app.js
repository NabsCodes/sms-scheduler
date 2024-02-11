const express = require('express');
const app = express();
const mongoose = require('mongoose');
// const messages = require('./messages');
const session = require('express-session');
const flash = require('connect-flash');
const { scheduleJob } = require('./utils');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/sms-scheduler')
	.then(() => console.log('Connected to DB!'))
	.catch(error => console.log('Error Connecting to Mongo: ' + error.message));


app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));
app.use(flash());

app.use((req, res, next) => {
	res.locals.messages = req.flash();
	next();
});

app.get('/', (req, res) => {
	res.render('index');
});

app.post('/', async (req, res) => {
	try {
		let { day, startTime, endTime, interval, title, message } = req.body;
		console.log(day, startTime, endTime, interval, title, message);

		day = Array.isArray(day) ? day : [day];
		title = Array.isArray(title) ? title : [title]; // Ensure title is an array

		if (!day || day.length === 0 || !startTime || !interval || !message || !title || title.length === 0) {
			req.flash('error', 'Please fill in all fields');
			return res.status(400).redirect('/');
		} else if (!/^[0-9,\s]*$/.test(message)) {
			req.flash('error', 'Phone numbers must only contain numbers');
			return res.status(400).redirect('/');
		} else if (startTime >= endTime) {
			req.flash('error', 'Start time must be before end time');
			return res.status(400).redirect('/');
		} else {
			const [startHour, startMinute] = startTime.split(':').map(item => +item);
			const [endHour, endMinute] = endTime.split(':').map(item => +item);

			const startMinutes = startHour * 60 + startMinute;
			const endMinutes = endHour * 60 + endMinute;
			const duration = endMinutes - startMinutes;

			if (interval > duration) {
				req.flash('error', 'Interval cannot be greater than the duration');
			} else {
				const receivers = message.split(',').map(item => item.trim());

				// Schedule a task for each title
				for (let t of title) {
					day.forEach(d => scheduleJob(d, startHour, startMinute, receivers, t));

					if (interval) {
						const intervalMinutes = +(interval);
						let nextMinutes = startMinutes + intervalMinutes;

						while (nextMinutes < endMinutes) {
							const nextHour = Math.floor(nextMinutes / 60);
							const nextMinute = nextMinutes % 60;

							day.forEach(d => scheduleJob(d, nextHour, nextMinute, receivers, t));

							nextMinutes += intervalMinutes;
						}
					}

					day.forEach(d => scheduleJob(d, endHour, endMinute, receivers, t));
				}

				req.flash('success', 'Tasks scheduled!');
			}
		}

		return res.status(200).redirect('/');
	} catch (err) {
		console.error('Error scheduling tasks:', err);
		req.flash('error', 'Error scheduling tasks');
		return res.status(500).redirect('/');
	}
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
