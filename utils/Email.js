const nodemailer = require('nodemailer');

module.exports = class Email {
	constructor(user, url) {
		this.to = user.email;
		this.form = `shopnow <${process.env.EMAIL_FROM}>`;
		this.url = url;
	}

	transport() {
		return nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			secure: false,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD,
			},
		});
	}

	async send(subject) {
		const mailOptions = {
			from: this.form, // sender address
			to: this.to, // list of receivers
			subject,
			text: this.url, // plain text body
			// html: '<b>Hello world?</b>', // html body
		};

		await this.transport().sendMail(mailOptions);
	}

	async sendPasswordResetEmail() {
		await this.send('Reset your password.');
	}
};
