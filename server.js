const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const app = require('./app'); // this must be after configuring .env file

console.log(process.env.DATABASE);
const DB = process.env.DATABASE.replace(
	'<password>',
	process.env.DATABASE_PASSWORD
);

mongoose.connect(DB, { useNewUrlParser: true }).then(() => {
	console.log('Connected to database successfully🙌');
});

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
	console.log(`App is listening on port ${port}...`);
});
