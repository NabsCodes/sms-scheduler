document.addEventListener('DOMContentLoaded', function () {
	flatpickr("#date", {
		dateFormat: "Y-m-d",
		minDate: "today",
	});

	// flatpickr("#endDate", {
	// 	dateFormat: "d-m-Y",
	// 	minDate: "today",
	// });

	// flatpickr("#startTime", {
	// 	enableTime: true,
	// 	noCalendar: true,
	// 	dateFormat: "H:i",
	// });

	// flatpickr("#endTime", {
	// 	enableTime: true,
	// 	noCalendar: true,
	// 	dateFormat: "H:i",
	// });
});