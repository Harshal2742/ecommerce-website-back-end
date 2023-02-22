const express = require('express');

const productsController = require('../controller/productsController');
const authController = require('../controller/authController');
const reviewsRouter = require('./reviewsRoutes');

const router = express.Router();

router
	.route('/')
	.get(productsController.getAllProducts)
	.post(
		authController.protect,
		authController.restrictTo('admin'),
		productsController.insertProduct
	);
	
	router
	.route('/:Id')
	.get(productsController.getProduct)
	.patch(
		authController.protect,
		authController.restrictTo('admin'),
		productsController.uploadProductImages,
		productsController.resizeProductImages,
		productsController.updateProduct
		)
		.delete(
			authController.protect,
			authController.restrictTo('admin'),
			productsController.deleteProduct
			);
			
router.get('/most/popular', productsController.getMostPopularProducts);
			
// redirecting the router
router.use('/:productId/reviews', reviewsRouter);

module.exports = router;
