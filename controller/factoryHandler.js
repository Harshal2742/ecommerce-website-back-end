const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFreatures = require('../utils/APIFeatures');

const excludedFields = (data, fields) => {
	const newData = { ...data };
	fields.forEach((field) => {
		delete newData[field];
	});

	return newData;
};

exports.getOne = (Model,popOptions) =>
	catchAsync(async (req, res, next) => {
		const { Id } = req.params;
		let query = Model.findById(Id);
		if(popOptions){
			query = query.populate(popOptions);
		}

		const doc = await query;

		if (!doc) {
			throw new AppError(404, 'There is no data with that ID!');
		}

		return res.status(200).json({
			status: 'success',
			data: {
				doc,
			},
		});
	});

exports.updateOne = (Model, fields) =>
	catchAsync(async (req, res, next) => {
		const { Id } = req.params;

		let data = req.body;
		if (fields) {
			data = excludedFields(data, fields);
		}

		// you can delete previous images (for that find the product using the ID delete images from img/products file
		// update the image and images field of product and do product.save() )
		if (req.files) {
			data.image = req.files.imageNames[0];
			data.images = req.files.imageNames;
		}

		const doc = await Model.findByIdAndUpdate(Id, data, {
			runValidators: true,
			new: true,
		});

		if (!doc) {
			throw new AppError(404, 'There is no data with that ID!');
		}

		return res.status(200).json({
			status: 'success',
			data: {
				doc,
			},
		});
	});

exports.deleteOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const { Id } = req.params;

		const doc = await Model.findByIdAndDelete(Id);

		if (!doc) {
			throw new AppError(404, 'There is no data with that ID!');
		}

		return res.status(200).json({
			status: 'success',
			data: null,
		});
	});

exports.createOne = (Model, fields) =>
	catchAsync(async (req, res, next) => {
		let data = req.body;

		if (fields) {
			data = excludedFields(data, fields);
		}

		const doc = await Model.create(data);

		res.status(200).json({
			status: 'success',
			data: {
				doc,
			},
		});
	});

exports.getAll = (Model) =>
	catchAsync(async (req, res, next) => {
		const freatures = new APIFreatures(req.query, Model.find())
			.filter()
			.sort()
			.fields()
			.limit();

		const doc = await freatures.query;

		res.status(200).json({
			status: 'success',
			result: doc.length,
			data: {
				doc,
			},
		});
	});
