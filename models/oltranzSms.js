const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const oltanzSmsSchema = new Schema({
	day: [String],
	interval: String,
	startTime: String,
	endTime: String,
	senderId: [String],
	receivers: [String],
	jobName: String,
	status: {
		type: String,
		enum: ['Active', 'Inactive'],
		default: 'Active'
	}
});

const OltranzSms = mongoose.model('OltranzSms', oltanzSmsSchema);

module.exports = OltranzSms;