const sendDevError = (err, req, res) => {
	if (req.originalUrl.startsWith('/api')) {
		return res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
			error: err,
			stack: err.stack,
		});
	}
	// log the error
	console.log('ERROR : ', err);

	return res.status(err.statusCode).render({
		title: 'Something went wrong',
		message: err.message,
	});
};

const sendProdError = (err, req, res) => {
	if (req.originalUrl.startsWith('/api')) {
		if (err.isOperational) {
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
			});
		}
		console.log('Error : ', err);

		return res.status(err.statusCode).json({
			title: 'error',
			message: 'Something went wrong',
		});
	}

	if (err.isOperational) {
		return res.status(err.statusCode).render({
			status: 'error',
			message: err.message,
		});
	}

	console.log('Error : ', err);

	return res.status(err.statusCode).json({
		status: 'error',
		message: 'Please try again later!',
	});
};

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		sendDevError(err, req, res);
	} else {
		let error = { ...err, name: err.name, message: err.message };

		sendProdError(error, req, res);
	}
};
