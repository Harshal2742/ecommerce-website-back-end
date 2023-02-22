const express = require('express');

const authController = require('../controller/authController');
const cartsController = require('../controller/cartsController');

const router = express.Router();

router.use(authController.protect);

router.use(authController.restrictTo('user', 'admin'));
router
	.route('/my-cart')
	.get(cartsController.getMyCart)
	.patch(cartsController.updateMyCart);

router.use(authController.restrictTo('admin'));
router.route('/').get(cartsController.getAllCart);

module.exports = router;
