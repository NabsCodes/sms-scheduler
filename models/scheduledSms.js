const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scheduledSmsSchema = new Schema({
	day: String,
	startTime: String,
	endTime: String,
	interval: Number,
	senderId: String,
	message: String,
	receivers: [String]
});

const ScheduledSms = mongoose.model('ScheduledSms', scheduledSmsSchema);

module.exports = ScheduledSms;