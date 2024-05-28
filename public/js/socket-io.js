const socket = io();

// Create a toast container element to hold multiple toasts
const toastContainer = document.createElement('div');
toastContainer.classList.add('toast-container', 'position-fixed', 'bottom-0', 'end-0', 'p-3');
document.body.appendChild(toastContainer);

const toastTemplate = document.createElement('div');
toastTemplate.classList.add('toast', 'fade', 'border-0', 'text-white');
toastTemplate.innerHTML = `
		<div class="toast-header">
			<img src="/images/New MKEL Blue.png" width="24" height="18" class="me-2" alt="Mkel logo">
			<strong class="me-auto">Scheduled SMS</strong>
			<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body"></div>
	`;

// Listen for success messages from the server
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

// Listen for error messages from the server
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

// Listen for task updates from the server and update the status badge
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

// Listen for count updates from the server and update the count badge
socket.on('jobCountsUpdated', function (data) {
	// Find the count badges for active and inactive jobs
	const activeJobsBadge = document.querySelector('.active-jobs-count');
	const inactiveJobsBadge = document.querySelector('.inactive-jobs-count');

	// Update the text of the count badges
	activeJobsBadge.textContent = data.activeJobs;
	inactiveJobsBadge.textContent = data.inactiveJobs;
});