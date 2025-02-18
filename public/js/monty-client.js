document.addEventListener('DOMContentLoaded', function () {
	// Update the time every second
	setInterval(() => {
		const now = new Date().toLocaleString('en-US', {
			timeZone: 'Africa/Lagos',
		});
		const date = new Date(now);
		const hour = `${date.getHours()}`.padStart(2, 0);
		const min = `${date.getMinutes()}`.padStart(2, 0);
		const day = `${date.getDate()}`.padStart(2, 0);
		const month = `${date.getMonth() + 1}`.padStart(2, 0); // Months are 0-based in JavaScript
		const year = date.getFullYear();
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		// Update the current day, date, and time
		document.getElementById('currentDay').textContent = `${days[date.getDay()]}, ${day}/${month}/${year}, ${hour}:${min}:${date.getSeconds()}`;
	});

	// Enable tooltips
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	[...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

	// Handle checkbox logic
	const predefinedNumbers = {
		// 'JAIZ BANK': ['2349099685313', '2348066464681', '2349015234141', '2348033531332'],
		'JAIZ BANK': ['2348033531332'],
		// 'JAIZ BANK': ['2348033531332', '2349099685313', '2348122353161'],
		// 'JAIZ BANK': ['2348033531332', '2348122353161'],
	};

	// Add listener to checkbox to click and update the message
	function addCheckboxListener(id, key) {
		document.getElementById(id).addEventListener('click', function () {
			if (this.checked) {
				// Update the message
				document.getElementById('message').value = predefinedNumbers[key].join(',');
			} else {
				// Clear the message
				document.getElementById('message').value = '';
			}
		});
	}

	// Add listener to checkbox
	addCheckboxListener('jaizbank', 'JAIZ BANK');

	// Add form submission handler
	const sendForm = document.getElementById('sendMessageForm');
	if (sendForm) {
		sendForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			try {
				const formData = new FormData(sendForm);
				const response = await fetch('/monty/sendnow', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(Object.fromEntries(formData)),
				});

				const data = await response.json();

				// Remove any existing flash messages
				const existingFlashes = document.querySelectorAll('.flashAlert');
				existingFlashes.forEach((flash) => flash.remove());

				// Create flash message
				const flashDiv = document.createElement('div');
				flashDiv.className = `alert text-center alert-${response.ok ? 'success' : 'danger'} alert-dismissible fade show flashAlert`;
				flashDiv.role = 'alert';
				flashDiv.innerHTML = `
					${response.ok ? data.message : data.error}
					<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
				`;

				// Insert the flash message before the card
				const card = document.querySelector('.card');
				card.parentNode.insertBefore(flashDiv, card);

				// Apply the hideFlash behavior
				setTimeout(() => {
					// Start the fade out
					flashDiv.style.opacity = '0';
					// After the transition is complete, remove the alert
					setTimeout(() => {
						flashDiv.remove();
					}, 1000); // This should match the transition duration in the CSS
				}, 5000);

				if (!response.ok) {
					throw new Error(data.error);
				}

				// Emit success event to socket
				socket.emit('messageSent', {
					message: data.message,
				});

				// Reset form
				sendForm.reset();
			} catch (error) {
				// Emit error event to socket
				socket.emit('messageError', {
					error: error.message,
				});
			}
		});
	}
});
