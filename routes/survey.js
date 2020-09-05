const router = require('express').Router(),
	Survey = require('../models/survey.model'),
	User = require('../models/user.model'),
	isLogin = require('../routes/isLogin');

//get surveys
router.route('/').get(isLogin, (req, res) => {
	updateSurveyStatus(req.user._id);
	User.findById(req.user._id)
		.populate('Surveys')
		.then(user => res.json(user.Surveys))
		.catch(err => res.status(400).json(err));
});

//update status of survey
const updateSurveyStatus = id => {
	User.findById(id).then(user => {
		user.Surveys.forEach(surveyID => {
			Survey.findByIdAndUpdate(surveyID).then(survey => {
				if (
					survey.duration.end < new Date().toISOString().slice(0, 13) ||
					survey.duration.start > new Date().toISOString().slice(0, 13)
				) {
					survey.status = false;
				} else {
					survey.status = true;
				}
				survey
					.save()
					.then(() => {
						return 'updated survey status';
					})
					.catch(err => {
						return err;
					});
			});
		});
	});
};

//add new survey
router.route('/').post(isLogin, (req, res) => {
	User.findByIdAndUpdate(req.user._id)
		.then(user => {
			const newSurvey = new Survey({
				name: req.body.name,
				description: req.body.description,
				Questions: req.body.Questions,
				preference: req.body.preference,
				duration: req.body.duration,
				created_by: {
					id: user._id,
					company: user.company,
					logo: user.logo
				}
			});
			newSurvey
				.save()
				.then(survey => {
					user.Surveys = user.Surveys.concat(survey._id);
					user.save();
					res.json(survey._id);
				})
				.catch(err => {
					res.status(400).json(err);
				});
		})
		.catch(err => res.json(err));
});

// add new user response
router.route('/response/:surveyID').put((req, res) => {
	let responses = [];
	Survey.findByIdAndUpdate(req.params.surveyID).then(survey => {
		for (let i = 0; i < survey.Questions.length; i++) {
			if (req.body.response[i] !== null && req.body.response[i] !== undefined) {
				if (
					survey.Questions[i].type === 'short answer' ||
					survey.Questions[i].type === 'Paragraph'
				) {
					survey.Questions[i].answers = survey.Questions[i].answers.concat(
						req.body.response[i].value[0]
					);
					responses[i] = {
						question: survey.Questions[i]._id,
						answer: req.body.response[i].value[0]
					};
				} else {
					survey.Questions[i].options.forEach(option => {
						req.body.response[i].value.forEach(ans => {
							if (ans == option._id) {
								option.votes = option.votes + 1;
								responses[i] = {
									question: survey.Questions[i]._id,
									answer: option._id
								};
							}
						});
					});
				}

				survey.Questions[i].stats.responses =
					survey.Questions[i].stats.responses + 1;
			}
			survey.Questions[i].stats.views = survey.Questions[i].stats.views + 1;
		}
		survey.stats.responses = survey.stats.responses + 1;
		survey.stats.views = survey.stats.views + 1;
		survey.responders = survey.responders.concat({
			name:
				req.body.responder.name ||
				'anonymous' + Math.floor(1000 + Math.random() * 9000),
			email:
				req.body.responder.email ||
				'anonymous' + Math.floor(1000 + Math.random() * 9000),
			responses: responses,
			date: new Date()
		});
		survey
			.save()
			.then(() => res.json('voted ++'))
			.catch(err => res.status(400).json('Error: ' + err));
	});
});

//search survey by id
router.route('/:id').get(isLogin, (req, res) => {
	User.findById(req.user._id)
		.populate('Surveys')
		.then(user => {
			if (
				user.Surveys.filter(survey => survey._id == req.params.id).length > 0
			) {
				res.json(
					(survey = user.Surveys.filter(
						survey => survey._id == req.params.id
					)[0])
				);
			} else {
				res.status(400).json('Access Denied');
			}
		})
		.catch(err => res.status(400).json(err));
});

//delete survey
router.route('/:id').delete(isLogin, (req, res) => {
	User.findById(req.user._id)
		.then(user => {
			user.Surveys.forEach(surveyID => {
				if (surveyID == req.params.id) {
					//remove survey
					Survey.findByIdAndDelete(surveyID)
						.then(() => res.json('successfully deleted survey'))
						.catch(err => res.status(400).json('Error: ' + err));
					User.findByIdAndUpdate(req.user._id).then(user => {
						user.Surveys = user.Surveys.filter(
							surveyID => surveyID != req.params.id
						);
						user.save();
					});
				}
			});
		})
		.catch(err => res.status(400).json('Error: ' + err));
});

// update survey
router.route('/:id').put(isLogin, (req, res) => {
	Survey.findByIdAndUpdate(req.params.id).then(survey => {
		survey.name = req.body.name;
		survey.description = req.body.description;
		survey.Questions = req.body.Questions;
		survey.preference = req.body.preference;
		survey.duration = req.body.duration;

		survey
			.save()
			.then(survey => res.json(survey._id))
			.catch(err => res.status(400).json('Error: ' + err));
	});
});

module.exports = router;
