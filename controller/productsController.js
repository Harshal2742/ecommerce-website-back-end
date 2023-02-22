const Product = require('../models/productModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factoryHandler = require('./factoryHandler');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const fileFilter = (res, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError(400, 'Not an images! Please upload images.'), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter,
});

exports.uploadProductImages = upload.array('images', 5);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
	if (!req.files) {
		return next();
	}

	const imageNames = [];

	await Promise.all(
		req.files.map(async (file, index) => {
			const fileName = `product-${req.params.Id}-${Date.now()}-${index}.jpeg`;
			await sharp(file.buffer)
				.resize(540, 720)
				.toFormat('jpeg')
				.jpeg({ quality: 90 })
				.toFile(`public/img/products/${fileName}`);

			imageNames.push(fileName);
		})
	);

	req.files.imageNames = imageNames;
	next();
});

exports.getMostPopularProducts = catchAsync(async (req, res, next) => {
	const products = await Product.aggregate([
		{
			$group: {
				_id: '$category',
				category: { $first: '$category' },
				image: { $first: '$image' },
			},
		},
		{
			$limit: 4,
		},
	]);

	res.status(200).json({
		status: 'success',
		data: {
			products,
		},
	});
});

exports.getAllProducts = factoryHandler.getAll(Product);
exports.getProduct = factoryHandler.getOne(Product, { path: 'reviews' });
exports.updateProduct = factoryHandler.updateOne(Product, [
	'avgRating',
	'ratingsQuantity',
	'reviewsQuantity',
]);

exports.deleteProduct = factoryHandler.deleteOne(Product);

exports.insertProduct = factoryHandler.createOne(Product, [
	'avgRating',
	'ratingsQuantity',
	'reviewsQuantity',
]);
