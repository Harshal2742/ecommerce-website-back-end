const mongoose = require('mongoose');
const Product = require('./productModel');
const AppError = require('../utils/AppError');

const reviewSchema = new mongoose.Schema({
	rating: {
		type: Number,
		required: [true, 'Review must contains rating!'],
		max: [5, 'Rating should be less than or equal to 5'],
		min: [1, 'Rating should be greater than or equal to 1'],
	},
	review: {
		type: String,
		default: '',
		trim: true,
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	},
	product: {
		type: mongoose.Schema.ObjectId,
		ref: 'Product',
		required: [true, 'Review must belongs to product!'],
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: [true, 'Review must belongs to user!'],
	},
	modified: {
		type: Boolean,
		default: false,
	},
});

// for preventing duplicate review
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// populate product
reviewSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'product',
		select: 'title brand image',
	}).populate({
		path: 'user',
		select: 'photo image firstName lastName',
	});

	next();
});

// defining static method to calculate avgRating for product
reviewSchema.statics.getAverageRating = async function (productId) {
	const stats = await this.aggregate([
		{
			$match: { product: productId },
		},
		{
			$group: {
				_id: '$product',
				avgRating: { $avg: '$rating' },
				ratingsQuantity: { $sum: 1 },
				reviewsQuantity: {
					$sum: { $cond: [{ $gt: [{ $strLenCP: '$review' }, 1] }, 1, 0] },
				},
			},
		},
	]);

	const result = stats[0];
	result.avgRating = Math.round(result.avgRating * 10) / 10;

	await Product.findByIdAndUpdate(productId, {
		avgRating: result.avgRating,
		ratingsQuantity: result.ratingsQuantity,
		reviewsQuantity: result.reviewsQuantity,
	});
};

// calculate avgRating after saving the new document
reviewSchema.post('save', async function (review) {
	// only run for create and save
	await this.constructor.getAverageRating(review.product);
});

// calculate avgRating after updating and deleting the review
// findOneAndUpdate
// findOneAndDelete
// As this is pointing to query(only in pre) in query middlerware so to get document clone the query
// In post query middlerware this will not point to query as query already executed
reviewSchema.pre(/^findOneAnd/, async function (next) {
	// store the document on this key word
	const review = await this.clone().findOne();
	if (!review) {
		next(new AppError(404, `No review found with that Id`));
	}
	this.review = review;
	next();
});

reviewSchema.post(/^findOneAnd/, async function () {
	await this.review.constructor.getAverageRating(this.review.product._id);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
