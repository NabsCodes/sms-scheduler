document.addEventListener('DOMContentLoaded', function () {
	// Get the table by its ID
	const table = document.querySelector('#montyTable');

	new DataTable(table, {
		"aLengthMenu": [
			[5, 10, 20, -1],
			[5, 10, 20, "All"]
		],
		"iDisplayLength": 5,
		scrollX: true,
		scrollY: true,
		order: [[0, 'asc']],
		language: {
			emptyTable: '<div class="alert alert-info text-center mb-0">No Scheduled SMS</div>'
		},
		columnDefs: [
			{ orderable: false, targets: [5, 6, 8] } // Disable ordering on some columnss
		],
		columns: [
			{ width: '0%' }, // S/N
			{ width: '11%' }, // Date
			{ width: '10%' }, // Interval
			{ width: '10%' }, // Start Time
			{ width: '10%' }, // End Time
			{ width: '10%' }, // SenderID
			{ width: '10%' }, // Phone Numbers
			{ width: '0%' }, // Status
			{ width: '0%' }  // Actions
		]
	});
});