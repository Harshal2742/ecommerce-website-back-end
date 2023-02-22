const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Cart = require('../models/cartModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/orderModel');
const factoryHandler = require('./factoryHandler');

exports.requestPayment = catchAsync(async (req, res, next) => {
	// Calculate the order total on the server to prevent
	// people from directly manipulating the amount on the client
	const user = req.user.id;
	console.log(user);
	const amount = (await Cart.findOne({ user })).totalAmount;
	// console.log(amount);

	if (amount === 0) {
		throw new AppError(
			404,
			"You don't have item's in a cart please add items and place order"
		);
	}

	const paymentIntent = await stripe.paymentIntents.create({
		amount,
		currency: 'inr',
		automatic_payment_methods: {
			enabled: true,
		},
	});

	res.status(200).json({
		status: 'success',
		data: {
			clientSecret: paymentIntent.client_secret,
		},
	});
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
	const user = req.user.id;
	const items = (await Cart.findOne({ user })).items;
	const address = req.body;

	const line_items = items.map((item) => {
		const data = {
			price_data: {
				currency: 'inr',
				product_data: {
					name: item.product.title,
					images: [
						`${req.protocol}://${req.get('host')}/img/products/${
							item.product.image
						}`,
					],
					metadata: {
						productId: item.product.id,
						mySelection: JSON.stringify(item.mySelection),
					},
				},
				unit_amount: item.product.price * 100,
			},
			quantity: item.quantity,
		};

		return data;
	});

	const session = await stripe.checkout.sessions.create({
		// success_url: `${req.protocol}://${req.get('host')}/home`,
		success_url: `http://localhost:3001/home`,
		line_items,
		cancel_url: `http://localhost:3001/home`,
		client_reference_id: req.user.id,
		currency: 'inr',
		metadata: {
			address: JSON.stringify(address),
		},
		mode: 'payment',
	});

	res.status(200).json({
		status: 'success',
		data: {
			url: session.url,
		},
	});
});

const createOrders = async (data) => {
	const { deliveryAddress, items, user } = data;

	const orders = items.map((item) => {
		return {
			user,
			product: item.price.product.metadata.productId,
			quantity: item.quantity,
			mySelection: JSON.parse(item.price.product.metadata.mySelection),
			deliveryAddress: JSON.parse(deliveryAddress),
			totalAmount: item.amount_total / 100,
		};
	});

	await Order.create(orders);
};

exports.getMyOrders = catchAsync(async (req, res, next) => {
	const user = req.user.id;
	const orders = await Order.find({ user })
		.populate({
			path: 'product',
			select: 'brand image title price',
		})
		.select('-user -deliveryAddress -mySelection');

	res.status(200).json({
		status: 'success',
		data: {
			orders,
		},
	});
});

exports.getMyOrder = catchAsync(async (req, res, next) => {
	const user = req.user.id;
	const orderId = req.params.orderId;

	const order = await Order.findOne({ user, _id: orderId })
		.populate({
			path: 'product',
			select: 'brand image title price',
		})
		.select('-user');

	if (!order) {
		throw new AppError(404, 'No order found with that Id!');
	}

	res.status(200).json({
		status: 'success',
		data: {
			order,
		},
	});
});

exports.getAllOrders = factoryHandler.getAll(Order);
exports.geOrder = factoryHandler.getOne(Order, 'product user');
exports.updateOrder = factoryHandler.updateOne(Order);
exports.deleteOrder = factoryHandler.deleteOne(Order);
exports.createOrder = factoryHandler.createOne(Order);

exports.webhookCheckout = catchAsync(async (req, res, next) => {
	let event;
	const endpointSecret = `${process.env.STRIPE_ENDPOINT_SECRET}`;

	if (endpointSecret) {
		const signature = req.headers['stripe-signature'];

		try {
			event = stripe.webhooks.constructEvent(
				req.body,
				signature,
				endpointSecret
			);
		} catch (err) {
			console.log('😱 Webhook signature verification failed.', err.message);
			return res.sendStatus(400);
		}
	} else {
	}

	if (event.type === 'checkout.session.completed') {
		const deliveryAddress = event.data.object.metadata.address;
		const user = event.data.object.client_reference_id;
		const result = await stripe.checkout.sessions.listLineItems(
			event.data.object.id,
			{
				expand: ['data.price.product'],
			}
		);

		await createOrders({ items: result.data, deliveryAddress, user });
	}

	res.status(200).json({
		received: true,
	});
});
