const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factoryHandler = require('./factoryHandler');

// For uploading images
// step1 : Define the options object fields for multer

// storage -> where to store the files
const multerStorage = multer.memoryStorage();

// fileFilter -> to control which files are accepted
const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError(400, 'Not an image! Please upload images.'), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter,
});

// Accept a single file with the name fieldname(here photo). The single file will be stored in req.file.
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
	// If photo is not uploaded the multer will not store it in req.file hence call to next middlerware
	if (!req.file) {
		return next();
	}

	// File name to update the database
	req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.file.filename}`);

	next();
});

// only for putting userId  on req.params
exports.getMe = (req, res, next) => {
	const userId = req.user.id;
	console.log(userId);
	if (userId) {
		req.params.Id = userId;
	} else {
		return next(new AppError(401, 'Please login to get your profile.'));
	}
	next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
	// create error if user want's to update password using this route
	const data = req.body;

	if (data.password || data.passwordConfirm) {
		throw new AppError(
			401,
			"Can't update password using this route please use /update-my-password route"
		);
	}

	// Filter the req.body (don't allow user to update role, active status, passwordChangedAt )
	const excludedFields = ['role', 'active', 'passwordChangedAt'];

	excludedFields.forEach((field) => {
		delete data[field];
	});

	// check here if user uploaded photo and add photo field with path name in data
	// Also delete the previous photo
	if (req.file) {
		if (req.user.photo !== 'default.jpeg') {
			await fs.promises.unlink(`public/img/users/${req.user.photo}`);
		}
		data.photo = req.file.filename;
	}

	const user = await User.findByIdAndUpdate(req.user.id, data, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	});
});

exports.deleteMe = catchAsync(async (req, res, next) => {

	const { currentPassword } = req.body;

	// get the user using req.user.id along with password
	const user = await User.findById(req.user.id).select('+password');

	// check the entered currentPassword is same as the password stored in db
	if (!(await user.isPasswordCorrect(currentPassword, user.password))) {
		throw new AppError(401, 'Current password is wrong');
	}

	await User.findByIdAndDelete(req.user.id);

	return res.status(200).json({
		status: 'success',
		data: null,
	});
});

exports.getAllUser = factoryHandler.getAll(User);

exports.createUser = (req, res, next) => {
	res.status(500).json({
		status: 'success',
		message: 'This route in not defined yet please use /signup instead.',
	});
};

exports.getUser = factoryHandler.getOne(User);
exports.updateUser = factoryHandler.updateOne(User);
exports.deleteUser = factoryHandler.deleteOne(User);
