const express = require('express');
const ordersController = require('../controller/ordersController');
const authController = require('../controller/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/checkout-session', ordersController.getCheckoutSession);

router.get('/my-orders', ordersController.getMyOrders);

router.get('/my-orders/:orderId',ordersController.getMyOrder);

router.use(authController.restrictTo('admin'));

router
	.route('/')
	.get(ordersController.getAllOrders)
	.post(ordersController.createOrder);
router
	.route('/:Id')
	.get(ordersController.geOrder)
	.patch(ordersController.updateOrder)
	.delete(ordersController.deleteOrder);

module.exports = router;
