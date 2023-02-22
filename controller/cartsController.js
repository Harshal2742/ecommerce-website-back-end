const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Cart = require('../models/cartModel');
const factoryHandler = require('./factoryHandler');
const Product = require('../models/productModel');

exports.getMyCart = catchAsync(async (req, res, next) => {
	const user = req.user.id;

	let cart = await Cart.findOne({ user });

	if (!cart) {
		cart = await Cart.create({ user });
	}

	res.status(200).json({
		status: 'success',
		data: {
			cart,
		},
	});
});

exports.updateMyCart = catchAsync(async (req, res, next) => {
	const { action, item: newItem } = req.body;
	const user = req.user.id;

	const cart = await Cart.findOne({ user });

	const existingItem = cart.items.find(
		(item) => item.product.id === newItem.product
	);

	if (action === 'increment') {
		const product = await Product.findById(newItem.product);
		if (!existingItem) {
			cart.items.push({ ...newItem });

			cart.totalQuantity += 1;
			cart.totalAmount += product.price;
			cart.totalDiscount += product.discountPrice;
		} else {
			existingItem.quantity += 1;
			cart.totalQuantity += 1;
			cart.totalAmount += existingItem.product.price;
			cart.totalDiscount += existingItem.product.discountPrice;
		}
	} else if (action === 'decrement') {
		if (!existingItem) {
			throw new AppError(404, 'Item not found in cart!');
		}

		existingItem.quantity -= 1;
		cart.totalQuantity -= 1;
		cart.totalAmount -= existingItem.product.price;
		cart.totalDiscount -= existingItem.product.discountPrice;

		if (existingItem.quantity === 0) {
			cart.items = cart.items.filter(
				(item) => item.product._id !== existingItem.product._id
			);
		}
	} else if (action === 'remove') {
		if (!existingItem) {
			throw new AppError(404, 'Item not found in cart!');
		}

		cart.totalQuantity -= existingItem.quantity;
		cart.totalAmount -= existingItem.product.price * existingItem.quantity;
		cart.totalDiscount -=
			existingItem.product.discountPrice * existingItem.quantity;

		cart.items = cart.items.filter(
			(item) => item.product._id !== existingItem.product._id
		);
	}

	const updatedCart = await (
		await cart.save()
	).populate({
		path: 'items.product',
		select: '_id brand title image price discountPrice',
	});

	res.status(200).json({
		status: 'success',
		data: {
			cart: updatedCart,
		},
	});
});

exports.getAllCart = factoryHandler.getAll(Cart);
