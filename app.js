const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');

const productsRouter = require('./routes/productsRoutes');
const usersRouter = require('./routes/usersRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const cartsRouter = require('./routes/cartsRoutes');
const ordersRouter = require('./routes/ordersRoutes');
const AppError = require('./utils/AppError');

const ordersController = require('./controller/ordersController');

const globalErrorHandler = require('./controller/errorController');

const app = express();

// This allow CORS for only get and post request
app.use(cors());

// For allowing CORS for PUT,PATCH,DELETE etc.
app.options('*', cors());

// middleware for serving static files
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

app.use(helmet.crossOriginResourcePolicy({policy:'cross-origin'}));

const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'To many requests from this IP, please try in an hours!',
});

app.use('/api', limiter);
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(
	express.urlencoded({
		extended: true,
		limit: '100kb',
	})
);

//Prevent parameter pollution
// This will remove duplicate parameter except the parameters specified in whitelist
app.use(
	hpp({
		whitelist: ['ratingsAverage', 'ratingsQuantity', 'price'],
	})
);

// For stripe Webhook endpoint
app.post(
	'/webhook-checkout',
	express.raw({ type: 'application/json' }),
	ordersController.webhookCheckout
);

// For serving static files in public folder which is used by API
app.use(express.static(path.join(__dirname, 'public')));

// middleware to put data send on req.body
app.use(express.json());

app.use(cookieParser());

app.use('/api/v1/products', productsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/carts', cartsRouter);
app.use('/api/v1/orders', ordersRouter);

app.all('*', (req, res, next) => {
	next(new AppError(404, `Can't find ${req.originalUrl} on this server`));
});

// ERROR handling middleware
// here express automatically specify error handing middleware having 4 arguments
app.use(globalErrorHandler);

module.exports = app;
