const mongoose = require('mongoose'),
	Survey = require('./survey.model');

const UserSchema = new mongoose.Schema({
	name: String,
	username: { type: String, unique: true },
	email: String,
	password: String,
	company: String,
	logo: String,
	Surveys: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Surveys' }]
});

module.exports = new mongoose.model('Users', UserSchema);
