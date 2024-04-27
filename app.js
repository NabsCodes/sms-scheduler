const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const http = require('http');
const { Server } = require('socket.io');
const events = require('./utils/events');
const ExpressError = require('./utils/ExpressError');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');
require('dotenv').config();
require('./utils/updateTask').startup();

const moment = require('moment-timezone');

// Import routers
const userRouter = require('./router/userRouter');
const homeRouter = require('./router/homeRouter');
const oltranzRouter = require('./router/oltranzRouter');
const montyRouter = require('./router/montyRouter');

// MongoDB Connection Setup check if in production or development
const dbUri = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'mongodb://localhost:27017/sms-scheduler';
mongoose.connect(dbUri)
	.then(() => console.log('Connected to DB!'))
	.catch(error => console.log(`Error Connecting to Mongo: ${error.message}`));

// Set up Mongoose connection event handlers
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Database Connected!');
});

// Create an Express app
const app = express();

// Force HTTPS on Heroku
app.use((req, res, next) => {
	if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
		return res.redirect('https://' + req.headers.host + req.url);
	}
	next();
});

// Set view engine to EJS and views directory
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use middleware for parsing request bodies and handling method override
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Use middleware for parsing JSON request bodies
app.use(express.json());

// Use middleware for parsing cookies
app.use(cookieParser());

// Use middleware for session and flash messages
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false },
	store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
}));
app.use(flash());

console.log(process.memoryUsage());

// Middleware to pass flash messages to all views
app.use((req, res, next) => {
	res.locals.messages = req.flash(); // Pass flash messages to all views
	res.locals.returnTo = req.session.returnTo; // Pass the returnTo URL to all views
	res.locals.user = req.user; // Pass the user object to all views
	next();
});

// Routes
app.use('/', homeRouter);
app.use('/', userRouter);
app.use('/oltranz', oltranzRouter);
app.use('/monty', montyRouter);

// console.log(moment.tz('Africa/Lagos').format('Z'));
// console.log(moment.tz('Africa/Lagos').utcOffset());
// console.log(moment.tz('Africa/Lagos').format());

// app.get('/test500', (req, res) => {
// 	throw new Error();
// });

// Catch All Route for 404 Errors
app.all('*', (_req, _res, next) => {
	next(new ExpressError('Page Not Found', 404)); // Pass error to error handling middleware
});

// Error Handling Middleware
app.use(errorHandler);

const port = process.env.PORT;

// Create a new HTTP server with the Express app
const server = http.createServer(app);

// Create a new Socket.IO server with the HTTP server
const io = new Server(server);

// Listen for new connections to the Socket.IO server
io.on('connection', () => {
	console.log('Client Connected!');
});

// Listen for 'messageSent' events
events.on('messageSent', (data) => {
	// Emit a 'messageSent' event to all connected clients with the event data
	io.emit('messageSent', data);
});

// Listen for 'messageError' events
events.on('messageError', (data) => {
	// Emit a 'messageError' event to all connected clients with the event data
	io.emit('messageError', data);
});

// Listen for 'taskUpdated' events
events.on('taskUpdated', (data) => {
	// Emit a 'taskUpdated' event to all connected clients with the event data
	io.emit('taskUpdated', data);
});

// Start the HTTP server on the specified port
server.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});

