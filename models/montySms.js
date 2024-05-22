const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const montySmsSchema = new Schema({
	date: String,
	interval: String,
	startTime: String,
	runCount: Number,
	runCountCompleted: {
		type: Number,
		default: 0
	},
	senderId: String,
	receivers: [String],
	jobName: String,
	status: {
		type: String,
		enum: ['Active', 'Inactive'],
		default: 'Active'
	}
});

const MontySms = mongoose.model('MontySms', montySmsSchema);

module.exports = MontySms;