const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
	id: Number,
	question: String,
	type: String,
	options: [{ option: String, votes: Number, default: 0 }],
	answers: [],
	stats: {
		responses: { type: Number, default: 0 },
		views: { type: Number, default: 0 }
	}
});
const surveySchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: String,
	status: { type: Boolean, default: true },
	Questions: [questionSchema],
	duration: { end: String, start: String },
	preference: {
		email: Boolean,
		name: Boolean,
		format: Boolean,
		confirmation_message: String,
		Next_Button: String,
		Previous_Button: String,
		Done_Button: String
	},
	created_by: {
		id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
		company: String,
		logo: String
	},
	created: {
		type: Date,
		default: Date.now
	},
	stats: {
		views: { type: Number, default: 0 },
		responses: { type: Number, default: 0 }
	},
	responders: [{ name: String, email: String, responses: [], date: String }]
});

module.exports = new mongoose.model('Surveys', surveySchema);
