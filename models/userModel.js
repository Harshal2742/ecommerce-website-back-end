const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
	firstName: {
		type: String,
		required: [true, 'Please provide first name!'],
		trim: true,
	},
	lastName: {
		type: String,
		required: [true, 'Please provide last name!'],
		trim: true,
	},
	email: {
		type: String,
		required: [true, 'Please provide email!'],
		unique: true,
	},
	phone: {
		type: String,
		required: [true, 'Please provide phone number!'],
		unique: true,
		minlength: 10,
	},
	photo: {
		type: String,
		default: 'default.jpeg',
	},
	dateOfBirth: Date,
	password: {
		type: String,
		required: [true, 'Please provide password!'],
		minlength: 8,
		select: false,
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm password!'],
		validate: {
			validator: function (value) {
				return this.password === this.passwordConfirm;
			},
			message: 'Password are not same',
		},
	},
	role: {
		type: String,
		enum: ['user', 'admin', 'seller'],
		default: 'user',
	},
	passwordChangedAt: {
		type: Date,
		select: false,
	},
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
});

// query middleware for not diplaying users having not active account
userSchema.pre(/^find/, function (next) {
	this.find({ active: { $ne: false } });
	next();
});

// document middlerware for setting passwordChangedAt if password is change
userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) {
		next();
	}

	this.passwordChangedAt = new Date(Date.now() - 1000);
	next();
});

// document middlerware for hashing user password before saving to database
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}

	this.password = await bcrypt.hash(this.password, 12);

	// delete passwordConfirm field
	this.passwordConfirm = undefined;

	next();
});

userSchema.methods.isPasswordCorrect = async function (
	enteredPassword,
	savedPassword
) {
	return await bcrypt.compare(enteredPassword, savedPassword);
};

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

	return resetToken;
};

userSchema.methods.passwordChangedAfter = function (JWTTimeStamp) {
	if (this.passwordChangedAt) {
		const passwordChangedAt = Date.parse(this.passwordChangedAt) / 1000; // because JWTTimeStamp is in seconds
		return JWTTimeStamp < passwordChangedAt;
	}
	return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
