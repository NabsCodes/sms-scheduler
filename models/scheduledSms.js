const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scheduledSmsSchema = new Schema({
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

const ScheduledSms = mongoose.model('ScheduledSms', scheduledSmsSchema);

module.exports = ScheduledSms;