// Select all alerts
const alerts = document.querySelectorAll('.flashAlert');

// Set a timeout to start the fade out
alerts.forEach(alert => {
	setTimeout(() => {
		// Start the fade out
		alert.style.opacity = '0';

		// After the transition is complete, remove the alert
		setTimeout(() => {
			alert.remove();
		}, 1000); // This should match the transition duration in the CSS
	}, 5000);
});