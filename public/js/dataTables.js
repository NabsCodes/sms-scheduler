document.addEventListener('DOMContentLoaded', function () {
	// Get the table by its ID
	let table = document.querySelector('#montyTable');

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
			emptyTable: 'No Scheduled SMS'
		},
		columnDefs: [
			{ orderable: false, targets: [4, 5, 7] } // Disable ordering on the first and third columns
		],
		columns: [
			{ width: '10%' }, // Date
			{ width: '10%' }, // Interval
			{ width: '10%' }, // Start Time
			{ width: '10%' }, // End Time
			{ width: '10%' }, // SenderID
			{ width: '10%' }, // Phone Numbers
			{ width: '10%' }, // Status
			{ width: '0%' }  // Actions
		]
	});
});