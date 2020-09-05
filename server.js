const express = require('express'),
	mongoose = require('mongoose'),
	cors = require('cors'),
	Survey = require('./routes/survey'),
	Account = require('./routes/account'),
	isLogin = require('./routes/isLogin'),
	User = require('./routes/user');

require('dotenv').config();

//connect to Atlas database
mongoose.connect(
	process.env.DB,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true
	},
	() => console.log('connected to the database')
);
const app = express(),
	port = process.env.PORT || 9000;

app.use(express.json());
app.use(cors());

app.use('/survey', Survey);
app.use('/account', Account);
app.use('/user', isLogin, User);
app.get('/img/:name', (req, res) => {
	res.sendFile(__dirname + '/routes/uploads/' + req.params.name);
});
app.listen(port, () => {
	console.log('server is running on port: ' + port);
});
