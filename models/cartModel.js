const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: [true, 'Cart must belongs to user'],
		unique: true,
		select: false,
	},
	items: [
		{
			product: {
				type: mongoose.Schema.ObjectId,
				ref: 'Product',
				required: [true, 'Cart should contain product details'],
			},
			quantity: {
				type: Number,
				default: 1,
			},
			mySelection: mongoose.Schema.Types.Mixed,
		},
	],

	totalAmount: { type: Number, default: 0 },
	totalQuantity: { type: Number, default: 0 },
	totalDiscount: { type: Number, default: 0 },
});

cartSchema.pre(/^find/, function (next) {
	this.populate({
		path:'items.product',
		select:'_id brand title image price discountPrice'
	});
	next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
