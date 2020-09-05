const router = require('express').Router(),
	Survey = require('../models/survey.model'),
	User = require('../models/user.model'),
	multer = require('multer'),
	bcrypt = require('bcrypt');

//search user
router.route('/').get((req, res) => {
	User.findOne({ _id: req.user._id })
		.then(user => res.json(user))
		.catch(err => res.json(err));
});

var storage = multer.diskStorage({
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
var upload = multer({ storage: storage }).single('companyLogo');

//update user info
router.route('/').put(async (req, res) => {
	upload(req, res, async function(err) {
		if (err instanceof multer.MulterError) {
			return res.status(500).json(err);
		} else if (err) {
			return res.status(500).json(err);
		} else {
			User.findByIdAndUpdate(req.user._id).then(async user => {
				const pass = await bcrypt.compare(req.body.password, user.password);
				if (!pass) return res.status(201).json('invalid password');

				user.name = req.body.name;
				user.username = req.body.username;
				user.email = req.body.email;
				user.company = req.body.company;
				user.Surveys.forEach(surveyID => {
					Survey.findByIdAndUpdate(surveyID).then(survey => {
						survey.created_by.company = req.body.company;
						survey.save();
					});
				});
				//save logo
				if (req.file !== undefined) {
					let newLogo =
						Date.now()
							.toString()
							.substring(0, 10) +
						'-' +
						req.file.originalname;
					user.logo = newLogo;
					user.Surveys.forEach(surveyID => {
						Survey.findByIdAndUpdate(surveyID).then(survey => {
							survey.created_by.logo = newLogo;
							survey.save();
						});
					});
				}
				if (req.body.new_password.length > 0) {
					user.password = await bcrypt.hash(req.body.new_password, 10);
				}
				user
					.save()
					.then(() => res.json('successfully updated'))
					.catch(err => res.status(400).json('Error: ' + err));
			});
		}
	});
});

//dashboard
router.route('/dashboard').get((req, res) => {
	let data = {
		views: 0,
		emails: 0,
		responders: 0,
		surveys: 0,
		active: 0,
		totalResponses: 0,
		responseRate: 0,
		Daily_Average: {
			Mon: 0,
			Tue: 0,
			Wed: 0,
			Thu: 0,
			Fri: 0,
			Sat: 0,
			Sun: 0
		},
		list: []
	};
	User.findById(req.user._id)
		.populate('Surveys')
		.then(user => {
			data.surveys = user.Surveys.length;
			data.active = user.Surveys.filter(
				survey => survey.status === true
			).length;
			data.list = user.Surveys;
			user.Surveys.forEach(survey => {
				data.views = data.views + survey.stats.views;
				data.totalResponses = data.totalResponses + survey.stats.responses;
				data.responseRate = (data.totalResponses / data.views) * 100;
				survey.responders.forEach(user => {
					if (user.email !== 'anonymous') {
						data.emails = data.emails + 1;
					}
					data.responders = data.responders + 1;
					data.Daily_Average[user.date.split(' ')[0]] =
						data.Daily_Average[user.date.split(' ')[0]] + 1;
				});
			});
			res.json(data);
		});
});

//delete user
router.route('/').delete((req, res) => {
	//delete surveys belong to that user
	User.findById(req.user._id).then(user => {
		user.Surveys.forEach(surveyID => {
			Survey.findByIdAndDelete(surveyID)
				.then(() => res.json('successfully deleted survey'))
				.catch(err => res.status(400).json('Error: ' + err));
		});
	});

	//then delete user
	User.findByIdAndDelete(req.user._id)
		.then(() => res.json('successfully deleted account'))
		.catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
