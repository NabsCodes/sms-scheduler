document.addEventListener('DOMContentLoaded', function () {
	// Get the start time and end time input fields by their IDs
	const startTimePicker = document.querySelector('#startTime');
	const endTimePicker = document.querySelector('#endTime');

	// const now = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos' }).format(new Date()));
	// const now = new Date();

	// Initialize Tempus Dominus on the start time and end time input fields
	new tempusDominus.TempusDominus(startTimePicker, {
		// min: now,
		localization: {
			locale: 'en-NG',
			format: 'HH:mm',
			hourCycle: 'h23'
		},
		display: {
			components: {
				calendar: false,
				date: true,
				month: true,
				year: true,
				decades: true,
				clock: true,
				hours: true,
				minutes: true,
				seconds: false
			},
			theme: 'auto'
		}
	});
	new tempusDominus.TempusDominus(endTimePicker, {
		// min: now,
		localization: {
			locale: 'en-NG',
			format: 'HH:mm',
			hourCycle: 'h23'
		},
		display: {
			components: {
				calendar: false,
				date: true,
				month: true,
				year: true,
				decades: true,
				clock: true,
				hours: true,
				minutes: true,
				seconds: false
			},
			theme: 'auto'
		}
	});
});