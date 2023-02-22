const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: [true, 'Order must belongs to user'],
	},
	product: {
		type: mongoose.Schema.ObjectId,
		ref: 'Product',
		required: [true, 'Order must belongs to product'],
	},
	quantity: {
		type: Number,
		default: 1,
	},
	mySelection: {
		type: mongoose.Schema.Types.Mixed,
		required: [true, 'Order must contains selection'],
	},
	deliveryAddress: {
		type: {
			firstName: String,
			lastName: String,
			houseNumber: Number,
			streetAddress: String,
			city: String,
			district: String,
			postalCode: Number,
			state: String,
			phoneNumber1: {
				type: String,
				maxlength: 10,
			},
			phoneNumber2: {
				type: String,
				maxlength: 10,
			},
		},

		required: [true, 'Order must contain delivey address!'],
	},
	orderDate: {
		type: Date,
		default: Date.now(),
	},
	orderStatus: {
		type: String,
		default: 'On the way',
		enum: ['On the way', 'delivered', 'cancelled'],
		required: [true, 'Order must have status!'],
	},
	totalAmount: {
		type: Number,
		required: [true, 'Order must contain total amount!'],
	},
	deliveryCharges: {
		type: Number,
		default: 0,
	},
	tax: {
		type: Number,
		default: 0,
	},
	discount: {
		type: Number,
		default: 0,
	},
	reviewed: {
		type: Boolean,
		default: false,
	},
	deliveredDate: {
		type: Date,
		default: null,
	},
	cancelledDate: {
		type: Date,
		default: null,
	},
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
