document.addEventListener('DOMContentLoaded', function () {
	// Update the time every second
	setInterval(() => {
		const now = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" });
		const date = new Date(now);
		const hour = `${date.getHours()}`.padStart(2, 0);
		const min = `${date.getMinutes()}`.padStart(2, 0);
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		// Update the current day and time
		document.getElementById('currentDay').textContent = days[date.getDay()] + ', ' + `${hour}:${min}:${date.getSeconds()}`;
	});

	// Enable tooltips
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

	// Handle checkbox logic
	const predefinedNumbers = {
		'JAIZ BANK': ['2348033531332', '2349099685313', '2348122353161', '2349157771949'],
		'PROVIDUS': ['2349099685313', '2348122353161', '2349157771949'],
		'PAYREP': ['2349099685313', '2348033531332', '2349157771949']
	};

	let firstChecked = null;

	function addCheckboxListener(id, key) {
		document.getElementById(id).addEventListener('click', function () {
			if (this.checked) {
				if (!firstChecked) {
					firstChecked = id;
					document.getElementById('message').value = predefinedNumbers[key].join(', ');
				}
			} else if (firstChecked === id) {
				firstChecked = null;
				document.getElementById('message').value = '';
				const checkboxes = ['jaizbank', 'providus', 'payrep'];
				for (let i = 0; i < checkboxes.length; i++) {
					const checkbox = document.getElementById(checkboxes[i]);
					if (checkbox.checked) {
						firstChecked = checkboxes[i];
						document.getElementById('message').value = predefinedNumbers[checkboxes[i]].join(', ');
						break;
					}
				}
			}
		});
	}
	// Add listeners to checkboxes
	addCheckboxListener('jaizbank', 'JAIZ BANK');
	addCheckboxListener('providus', 'PROVIDUS');
	addCheckboxListener('payrep', 'PAYREP');
});
