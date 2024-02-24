document.addEventListener('DOMContentLoaded', function () {
	// Update the time every second
	setInterval(() => {
		const now = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" });
		const date = new Date(now);
		const hour = `${date.getHours()}`.padStart(2, 0);
		const min = `${date.getMinutes()}`.padStart(2, 0);
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		// Update the year
		document.getElementById("year").textContent = date.getFullYear();
		// Update the current day and time
		document.getElementById('currentDay').textContent = days[date.getDay()] + ', ' + `${hour}:${min}:${date.getSeconds()}`;
	});

	// Handle theme switching
	const theme = localStorage.getItem('theme');
	const body = document.body;
	const checkbox = document.getElementById('flexSwitchCheckReverse');
	const label = document.querySelector('label[for="flexSwitchCheckReverse"]');
	// Set the initial theme based on local storage
	if (theme === 'dark') {
		body.setAttribute('data-bs-theme', 'dark');
		checkbox.checked = true;
		label.innerHTML = ' <i class="bi bi-sun nav-edit"></i> Light Mode';
	}
	// Update the theme when the checkbox is toggled
	checkbox.addEventListener('change', function () {
		if (this.checked) {
			body.setAttribute('data-bs-theme', 'dark');
			localStorage.setItem('theme', 'dark');
			label.innerHTML = ' <i class="bi bi-sun nav-edit"></i> Light Mode';
		} else {
			body.setAttribute('data-bs-theme', 'light');
			localStorage.setItem('theme', 'light');
			label.innerHTML = ' <i class="bi bi-moon-stars nav-edit"></i> Dark Mode';
		}
	});

	// Enable tooltips
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

	const socket = io();

	// Create a toast container element to hold multiple toasts
	const toastContainer = document.createElement('div');
	toastContainer.classList.add('toast-container', 'position-fixed', 'bottom-0', 'end-0', 'p-3');
	document.body.appendChild(toastContainer);

	const toastTemplate = document.createElement('div');
	toastTemplate.classList.add('toast', 'fade', 'border-0', 'text-white');
	toastTemplate.innerHTML = `
		<div class="toast-header">
			<img src="/images/New MKEL Blue.png" width="24" height="18" class="rounded me-2" alt="Mkel logo">
			<strong class="me-auto">Scheduled SMS</strong>
			<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body"></div>
	`;

	socket.on('messageSent', (msg) => {
		// Create a new toast for each message
		const newToast = toastTemplate.cloneNode(true);
		newToast.querySelector('.toast-body').textContent = msg.message;
		newToast.classList.add('bg-success');
		// Append the new toast to the toast container
		toastContainer.appendChild(newToast);
		// Show the new toast
		bootstrap.Toast.getOrCreateInstance(newToast).show();

		setTimeout(() => {
			newToast.remove();
		}, 5000);
	});

	socket.on('messageError', function (msg) {
		const newToast = toastTemplate.cloneNode(true);
		newToast.querySelector('.toast-body').textContent = msg.error;
		newToast.classList.add('bg-danger');
		toastContainer.appendChild(newToast);
		bootstrap.Toast.getOrCreateInstance(newToast).show();

		setTimeout(() => {
			newToast.remove();
		}, 5000);
	});

	socket.on('taskUpdated', function (data) {
		// Find the status badge for the updated task
		const statusBadge = document.querySelector(`#task-${data.taskId} .badge`);

		// Update the class and text of the status badge
		if (data.status === 'Active') {
			statusBadge.className = 'badge bg-success';
		} else {
			statusBadge.className = 'badge bg-danger';
		}
		statusBadge.textContent = data.status;
	});

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
