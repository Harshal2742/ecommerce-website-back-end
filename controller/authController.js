const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const Email = require('../utils/Email');
const crypot = require('crypto');
const { promisify } = require('util');

const signinToken = (userId) => {
	// Please note that exp or any other claim is only set if the payload is an object literal
	return jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

const createAndSendToken = (user, statusCode, req, res) => {
	const token = signinToken(user._id);

	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
		secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
	};

	res.cookie('shopnow', token, cookieOptions);

	if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
		cookieOptions.secure = true;
	}

	// for not showing password and active status
	user.password = undefined;
	user.active = undefined;
	user.passwordChangedAt = undefined;

	res.status(statusCode).json({
		status: 'sucess',
		token,
		data: {
			user,
		},
	});
};

exports.signup = catchAsync(async (req, res, next) => {
	const { firstName, lastName, email, phone, password, passwordConfirm } =
		req.body;

	// create new user in database
	const user = await User.create({
		firstName,
		lastName,
		email,
		phone,
		password,
		passwordConfirm,
	});

	// send welcome email

	// create and send jwt token in cookie
	createAndSendToken(user, 201, req, res);
});

exports.signin = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	// check email and password exist
	if (!email || !password) {
		throw new AppError(400, 'Please provide email and password!');
	}

	// check user exist and entered password is correct
	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.isPasswordCorrect(password, user.password))) {
		throw new AppError(403, 'Invalid email or password!');
	}

	// create and send jwt token in cookie and also in response
	createAndSendToken(user, 201, req, res);
});

exports.signout = catchAsync(async (req, res, next) => {
	res.cookie('shopnow', 'not a token', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	res.status(200).json({
		status: 'success',
	});
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
	const { email } = req.body;

	const user = await User.findOne({ email });

	if (!user) {
		throw new AppError(404, 'No user exist with that email!');
	}

	const resetToken = user.createPasswordResetToken();

	// save the document in database after setting passwordResetToken and passwordResetExpires without
	// running the validator else this will throw error for password field
	await user.save({ validateBeforeSave: false });

	// create reset url and send it to the user throw email
	try {
		const resetURL = `${req.protocol}://${req.get(
			'host'
		)}/api/v1/users/reset-password/${resetToken}`;

		await new Email(user, resetURL).sendPasswordResetEmail();
		res.status(200).json({
			status: 'success',
			message: 'Token send to email',
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });

		return next(
			new AppError(
				500,
				'There was error while sending the email please try later.'
			)
		);
	}
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	const { password, passwordConfirm } = req.body;
	const resetToken = req.params.resetToken;
	const hashedToken = crypot
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	});

	if (!user) {
		throw new AppError(400, 'Invalid password reset token or token expired!');
	}

	user.password = password;
	user.passwordConfirm = passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save(); // this will also update the passwordChangedAt field

	// create and send jwt token in cookie and also in response
	createAndSendToken(user, 201, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
	let token;

	//  1) Getting the token check if it's there
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.shopnow) {
		token = req.cookies.shopnow;
	}

	if (!token) {
		throw new AppError(
			401,
			'Your are not logged in. Please login to get access.'
		);
	}

	//2) Verification of token
	// jwt.verify is synchronous function and it takes callback. Here we can use Promisify
	// Promisify : It is the conversion of a function that accepts a callback into a function that returns a promise
	// Promisify take the function that accepts a callback and return a function that return a promise
	const decoded = await promisify(jwt.verify)(
		token,
		process.env.JWT_SECRET_KEY
	);

	// 3) Check if user still exists
	const user = await User.findById(decoded.userId);

	if (!user) {
		throw new AppError(401, 'User no longer exist!');
	}

	// 4) Check the user changed the password after the token was issued
	if (user.passwordChangedAfter(decoded.iat)) {
		throw new AppError(
			401,
			'User recently changed password! Please login again.'
		);
	}

	// put the user data on request
	req.user = user;

	// GRANT ACCESS TO PROTECTED ROUTE
	next();
});

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError(403, "You don't have permission to perform this action.")
			);
		}
		next();
	};
};

exports.updatePassword = catchAsync(async (req, res, next) => {
	// NOTE: Here findByIdAndUpdate is not used because it will not run middleware

	// extract data from req.body
	const { currentPassword, password, passwordConfirm } = req.body;

	// get the user using req.user.id along with password
	const user = await User.findById(req.user.id).select('+password');

	// check the entered currentPassword is same as the password stored in db
	if (!(await user.isPasswordCorrect(currentPassword, user.password))) {
		throw new AppError(401, 'Current password is wrong');
	}

	// update the password
	user.password = password;
	user.passwordConfirm = passwordConfirm;

	// save the document
	await user.save();

	// create and send jwt token in cookie and also in response
	createAndSendToken(user, 201, req, res);
});
