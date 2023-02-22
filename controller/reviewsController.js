const Review = require('../models/reviewModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factoryHandler = require('./factoryHandler');

exports.getAllReviews = catchAsync(async (req, res, next) => {
	let filter = {};
	if (req.params.productId) {
		filter.product = req.params.productId;
	}

	const reviews = await Review.find(filter);

	res.status(200).json({
		status: 'success',
		result: reviews.length,
		data: {
			reviews,
		},
	});
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
	const user = req.user.id;
	const reviews = await Review.find({ user }).select('-user');

	res.status(200).json({
		status: 'success',
		result: reviews.length,
		data: {
			reviews,
		},
	});
});

exports.createMyReview = catchAsync(async (req, res, next) => {
	const data = req.body;

	const product = req.params.productId;
	const user = req.user.id;

	if (!user || !product) {
		throw new AppError(
			400,
			'Review must belongs to user and product. Please login again'
		);
	}

	data.product = product;
	data.user = user;

	const review = await Review.create(data);

	res.status(200).json({
		status: 'success',
		data: {
			review,
		},
	});
});

exports.getMyReview = catchAsync(async (req, res, next) => {
	const { reviewId } = req.params;
	const user = req.user.id;

	const review = await Review.findOne({ _id: reviewId, user }).select('-user');

	if (!review) {
		throw new AppError(400, 'No review found with that ID');
	}

	res.status(200).json({
		status: 'success',
		data: {
			review,
		},
	});
});

exports.deleteMyReview = catchAsync(async (req, res, next) => {
	const { reviewId } = req.params;
	const user = req.user.id;

	const review = await Review.findOneAndDelete({ _id: reviewId, user });

	if (!review) {
		throw new AppError(400, 'No review found with that ID');
	}

	res.status(200).json({
		status: 'success',
		data: null,
	});
});

exports.updateMyReview = catchAsync(async (req, res, next) => {
	const { reviewId } = req.params;
	const user = req.user.id;

	const data = {};
	
	data.review = req.body.review;
	data.rating = req.body.rating;
	data.modified = true;

	const review = await Review.findOneAndUpdate({ _id: reviewId, user }, data, {
		new: true,
		runValidators: true,
	});

	if (!review) {
		throw new AppError(400, 'No review found with that ID');
	}

	res.status(200).json({
		status: 'success',
		data: {
			review,
		},
	});
});

exports.getReview = factoryHandler.getOne(Review);
exports.updateReview = factoryHandler.updateOne(Review);
exports.deleteReview = factoryHandler.deleteOne(Review);
