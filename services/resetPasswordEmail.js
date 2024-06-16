const nodemailer = require('nodemailer');

const resetEmail = async (recipient, subject, link) => {
	// Create a transporter
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'vas.mkelnetworks@gmail.com', // Replace with your email
			pass: 'klqm kpkd hdhn svtc', // Replace with your email password
		},
	});

	const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <p><a href="${link}" target="_blank">Reset Password</a></p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
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

module.exports = resetEmail;
