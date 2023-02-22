const express = require('express');
const usersController = require('../controller/usersController');
const authController = require('../controller/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.get('/signout', authController.signout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:resetToken', authController.resetPassword);

router.use(authController.protect); // login required

router.patch('/update-my-password', authController.updatePassword);
router.get('/me', usersController.getMe, usersController.getUser);
router.patch(
	'/update-me',
	usersController.uploadUserPhoto,
	usersController.resizeUserPhoto,
	usersController.updateMe
);
router.delete('/delete-me', usersController.deleteMe);

router.use(authController.restrictTo('admin'));

router
	.route('/')
	.get(usersController.getAllUser)
	.post(usersController.createUser);

router
	.route('/:Id')
	.get(usersController.getUser)
	.patch(usersController.updateUser)
	.delete(usersController.deleteUser);

module.exports = router;
