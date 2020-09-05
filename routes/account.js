const router = require('express').Router(),
	User = require('../models/user.model'),
	bcrypt = require('bcrypt'),
	Token = require('jsonwebtoken'),
	multer = require('multer');

let storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './routes/uploads');
	},
	filename: function(req, file, cb) {
		cb(
			null,
			Date.now()
				.toString()
				.substring(0, 10) +
				'-' +
				file.originalname
		);
	}
});
let upload = multer({ storage: storage }).single('companyLogo');

//create new account
router.route('/').post(async (req, res) => {
	upload(req, res, async function(err) {
		if (err instanceof multer.MulterError) {
			return res.status(500).json(err);
		} else if (err) {
			return res.status(500).json(err);
		} else {
			let logo = null;
			if (req.file !== undefined) {
				logo =
					Date.now()
						.toString()
						.substring(0, 10) +
					'-' +
					req.file.originalname;
			}
			const newUser = new User({
				name: req.body.name,
				username: req.body.username,
				email: req.body.email,
				company: req.body.company,
				logo: logo,
				password: await bcrypt.hash(req.body.password, 10)
			});

			newUser
				.save()
				.then(user => {
					const newToken = Token.sign({ _id: user._id }, 'tokensecret.env');
					res.header('auth-Token', newToken);
					res.json(newToken);
				})
				.catch(err =>
					res.status(202).json('That username is taken. Try another ')
				);
		}
	});
});
// login
router.route('/login').post(async (req, res) => {
	const user = await User.findOne({ username: req.body.username });
	if (!user) return res.status(201).json("can't find your username");
	const pass = await bcrypt.compare(req.body.password, user.password);
	if (!pass) return res.status(201).json('invalid password');
	const newToken = Token.sign({ _id: user._id }, 'tokensecret.env');
	res.header('auth-Token', newToken);
	res.json(newToken);
});

module.exports = router;
