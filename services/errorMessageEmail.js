const nodemailer = require('nodemailer');

const errorEmail = async (recipient, subject, error, destination) => {
	// Create a transporter
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'vas.mkelnetworks', // Replace with your email
			pass: 'klqm kpkd hdhn svtc', // Replace with your email password
		},
	});

	const htmlContent = `
        <div style="font-family: Lato, sans-serif; color: #333;">
            <h2 style="color: #f04124;">SMS Error Response</h2>
            <p style="font-size: 16px; line-height: 1.5;">SMS has failed to deliver to: <strong>${destination}</strong>.</p>
            <p style="font-size: 16px; line-height: 1.5;">Please kindly check below again to confirm the response message:</p>
            <p style="font-size: 14px; line-height: 1.5; color: #f04124;"><strong>${error}</strong></p>
        </div>
`;

	// Define the mail options
	const mailOptions = {
		from: '"MKEL SMS Scheduler" vas.mkelnetworks@gmail.com',
		to: recipient,
		subject,
		html: htmlContent,
	};

	// Send the email
	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.log('Error sending email: ', error);
		throw error;
	}
};

module.exports = errorEmail;
