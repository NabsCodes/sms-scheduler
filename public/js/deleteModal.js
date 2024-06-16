// Delete Scheduled Modal Handler
function setupDeleteModalHandler(buttonClass) {
	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.' + buttonClass).forEach((button) => {
			button.addEventListener('click', function () {
				const id = this.getAttribute('data-id');
				const baseRoute = this.getAttribute('data-base-route');
				document.getElementById('deleteForm').action = baseRoute + id + '?_method=DELETE';
			});
		});
	});
}

setupDeleteModalHandler('deleteButton');
