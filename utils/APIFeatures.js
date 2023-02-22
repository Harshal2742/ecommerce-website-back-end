class APIFreatures {
	constructor(queryObj, query) {
		this.queryObj = queryObj;
		this.query = query;
	}

	filter() {
		// get all filter fields separated by ;
		if (!this.queryObj.flt) {
			return this;
		}

		const filterFields = this.queryObj.flt.split(';');

		// convert filerFileds into object containing field as key and values as array of values
		const filterObj = {};
		filterFields.forEach((el) => {
			const field = el.split(':');

			filterObj[field[0]] = field[1].split(',');
		});

		// console.log(filterObj);

		if (filterObj.gender) {
			this.query.find({ gender: { $in: filterObj.gender } });
		}

		if (filterObj.brand) {
			this.query.find({ brand: { $in: filterObj.brand } });
		}

		if (filterObj.color) {
			this.query.find({ 'selection.color': { $in: filterObj.color } });
		}
		if (filterObj.size) {
			this.query.find({ 'selection.size': { $in: filterObj.size } });
		}

		if (filterObj.price) {
			// create condition objects for each range
			const conditions = filterObj.price.map((el) => {
				const range = el.split('to');
				return { price: { $gte: range[0], $lte: range[1] } };
			});

			// console.log(conditions);
			// put all conditions in or
			this.query.find({ $or: conditions });
		}

		if (filterObj.avgRating) {
			this.query.find({ avgRating: { $gte: +filterObj.avgRating[0] } });
		}

		if (filterObj.category) {
			this.query.find({ category: { $in: filterObj.category } });
		}

		return this;
	}

	sort() {
		if (this.queryObj.sort) {
			const sortFields = this.queryObj.sort.replaceAll(',', ' ');
			this.query.sort(sortFields);
		} else {
			this.query.sort('price');
		}

		return this;
	}

	fields() {
		if (this.queryObj.fields) {
			const fields = this.queryObj.fields.replaceAll(',', ' ');
			this.query.select(fields);
		} else {
			this.query.select('-__v');
		}

		return this;
	}

	limit() {
		if (this.queryObj.limit) {
			this.query.limit(+this.queryObj.limit);
		}
    
		return this;
	}
}

module.exports = APIFreatures;
