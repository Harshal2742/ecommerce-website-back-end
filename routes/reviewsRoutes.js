const express = require('express');
const reviewsController = require('../controller/reviewsController');
const authController = require('../controller/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
	.route('/')
	.get(reviewsController.getAllReviews)
	.post(authController.restrictTo('user'), reviewsController.createMyReview);

router.route('/my-reviews').get(reviewsController.getMyReviews);

router
	.route('/my-reviews/:reviewId')
	.get(authController.restrictTo('user'), reviewsController.getMyReview)
	.delete(authController.restrictTo('user'), reviewsController.deleteMyReview)
	.patch(authController.restrictTo('user'), reviewsController.updateMyReview);

router.use(authController.restrictTo('admin'));
router
	.route('/:Id')
	.get(reviewsController.getReview)
	.patch(reviewsController.updateReview)
	.delete(reviewsController.deleteReview);

module.exports = router;
