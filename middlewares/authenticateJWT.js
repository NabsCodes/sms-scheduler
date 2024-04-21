const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateJWT = (req, res, next) => {
	const token = req.cookies.token;
	console.log(token);
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
			if (err) {
				console.log(err.message, 'Token verification failed');
				return res.redirect('/login');
			} else {
				req.user = decoded;
				next();
			}
		});
	} else {
		console.log('No token found');
		res.redirect('/login');
	}
};

module.exports = authenticateJWT;