document.addEventListener('DOMContentLoaded', () => {
	setInterval(() => {
		const now = new Date();
		const hour = `${now.getHours()}`.padStart(2, 0);
		const min = `${now.getMinutes()}`.padStart(2, 0);
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		// Get the current year
		document.getElementById("year").textContent = now.getFullYear();
		// Get the current date and day
		// const amPm = now.getHours() >= 12 ? 'PM' : 'AM';
		document.getElementById('currentDay').textContent = `${days[now.getDay()]}, ${hour}:${min}`;
	});

	const theme = localStorage.getItem('theme');
	const body = document.body;
	const checkbox = document.getElementById('flexSwitchCheckReverse');
	const label = document.querySelector('label[for="flexSwitchCheckReverse"]');

	if (theme === 'dark') {
		body.setAttribute('data-bs-theme', 'dark');
		checkbox.checked = true;
		label.textContent = 'Light Mode';
	}

	checkbox.addEventListener('change', () => {
		if (this.checked) {
			body.setAttribute('data-bs-theme', 'dark');
			localStorage.setItem('theme', 'dark');
			label.textContent = 'Light Mode';
		} else {
			body.setAttribute('data-bs-theme', 'light');
			localStorage.setItem('theme', 'light');
			label.textContent = 'Dark Mode';
		}
	});

	// Enable tooltips
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

	const predefinedNumbers = {
		'JAIZ BANK': ['2348033531332', '2349099685313', '2348122353161', '2349157771949'],
		'PROVIDUS': ['2349099685313', '2348122353161', '2349157771949'],
		'PAYREP': ['2349099685313', '2348033531332', '2349157771949']
		// 'JAIZ BANK': ['2348033531332'],
		// 'PROVIDUS': ['2348122353161', '2348122353161'],
		// 'PAYREP': ['2348033531332']
	};

	let firstChecked = null;

	function addCheckboxListener(id, key) {
		document.getElementById(id).addEventListener('click', () => {
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

	addCheckboxListener('jaizbank', 'JAIZ BANK');
	addCheckboxListener('providus', 'PROVIDUS');
	addCheckboxListener('payrep', 'PAYREP');
});
