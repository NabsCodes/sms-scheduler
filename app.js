const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');
const scheduleRouter = require('./router/schedule');
const methodOverride = require('method-override');
const http = require('http');
const { Server } = require('socket.io');
const events = require('./utils/events');
const ExpressError = require('./utils/ExpressError');
require('dotenv').config();
require('./utils/updateTask').startup();

const dbUri = process.env.MONGODB_URI;
// || 'mongodb://localhost:27017/sms-scheduler';
// const dbUri = 'mongodb://localhost:27017/sms-scheduler';
mongoose.connect(dbUri)
	.then(() => console.log('Connected to DB!'))
	.catch(error => console.log(`Error Connecting to Mongo: ${error.message}`));

// Set up Mongoose connection event handlers
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Database Connected!');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));
app.use(flash());

app.use((req, res, next) => {
	res.locals.messages = req.flash();
	next();
});

// Routes
app.use('/', scheduleRouter);

// Error Handling
app.all('*', (_req, _res, next) => {
	next(new ExpressError('Page Not Found', 404));
});

app.use((err, _req, res, _next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Oh No, Something Went Wrong!';
	res.status(statusCode).render('error', { err });
});

const port = process.env.PORT;

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', () => {
	console.log('Client Connected!');
});

events.on('messageSent', (data) => {
	io.emit('messageSent', data);
});

events.on('messageError', (data) => {
	io.emit('messageError', data);
});

events.on('taskUpdated', (data) => {
	io.emit('taskUpdated', data);
});

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

