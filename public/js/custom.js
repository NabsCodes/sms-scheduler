// Navbar
window.addEventListener('scroll', function () {
	let navbarBrand = document.querySelector('.navbar-brand');
	navbarBrand.classList.toggle('active', windowPosition);
});

// Toggle Dark or Light Mode
document.addEventListener('DOMContentLoaded', function () {
	// Get the current year
	document.getElementById("year").textContent = new Date().getFullYear();

	const theme = localStorage.getItem('theme');
	const body = document.body;
	const checkbox = document.getElementById('flexSwitchCheckReverse');
	const label = document.querySelector('label[for="flexSwitchCheckReverse"]');

	if (theme === 'dark') {
		body.setAttribute('data-bs-theme', 'dark');
		checkbox.checked = true;
		label.textContent = 'Light Mode';
	}

	checkbox.addEventListener('change', function () {
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
});

