const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
	{
		brand: {
			type: String,
			required: [true, 'Product must have brand!'],
			uppercase: true,
			trim: true,
		},
		title: {
			type: String,
			required: [true, 'Product must have title!'],
			trim: true,
			maxLength: [50, 'Title should not be greater than 50 character.'],
		},
		image: {
			type: String,
			required: [true, 'Product must have at least one image!'],
		},
		images: [String],
		selection: {
			type: mongoose.Schema.Types.Mixed,
			required: [true, 'Product must have selection!'],
		},
		discription: {
			type: String,
			trim: true,
		},
		price: {
			type: Number,
			required: [true, 'Product must have price!'],
		},
		avgRating: {
			type: Number,
			default: 4.5,
			max: [5, 'Average rating should be less than or equal to 5'],
			min: [1, 'Average rating should be greater than or equal to 1'],
		},
		ratingsQuantity: {
			type: Number,
			default: 0,
		},
		reviewsQuantity: {
			type: Number,
			default: 0,
		},
		discountPrice: {
			type: Number,
			default: 0,
		},
		launchDate: {
			type: Date,
			default: Date.now(),
		},
		gender: {
			type: [String],
		},
		seller: {
			type: String,
			required: [true, 'Product must have a seller!'],
			trim: true,
		},
		category: {
			type: String,
			required: [true, 'Product must belongs to particular category!'],
			trim: true,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

productSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'product',
	localField: '_id',
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
