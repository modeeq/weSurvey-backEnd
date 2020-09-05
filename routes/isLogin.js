const bcrypt = require('bcrypt'),
	Token = require('jsonwebtoken');

//check if user is login
const auth = (req, res, next) => {
	const token = req.header('auth-Token');
	if (!token) res.status(202).json('access denied');
	try {
		const verified = Token.verify(token, 'tokensecret.env');
		req.user = verified;
		next();
	} catch (err) {
		res.status(202).json('invalid token');
	}
};

module.exports = auth;
