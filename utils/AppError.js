class AppError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
		this.message = message;
		this.isOperational = true;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'success';

		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = AppError;
