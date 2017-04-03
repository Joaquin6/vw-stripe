var Q = require("q"),
	_ = require("underscore"),
	Err = require("custom-err"),
	db = require("libs/db"),
	debug = require("libs/buglog"),
	Cache = require("libs/helpers/cache"),
	log = debug("models", "item");

module.exports = {
	find: function(parameters, options) {
		var deferred = Q.defer();
		options = _.extend({
			excludePrivateLabelQuery: true
		}, options);

		var guid = null;
		if (options.guid) {
			guid = options.guid;
			delete options.guid;
		}

		var privateLabel = false;
		if (_.has(parameters, 'privateLabel')) {
			privateLabel = parameters.privateLabel;
			delete parameters.privateLabel;
		}

		if (!privateLabel || !options.excludePrivateLabelQuery)
			parameters["specification ->> private_label_item"] = 0;
		else {
			parameters["specification ->> private_label_item"] = [0, 1];
			parameters["specification ->> private_label_customer_1"] = ['', privateLabel];
		}

		// parameters = __addPrivateLabelQry(parameters, privateLabel);

		db.item.find(parameters, function(err, results) {
			if (err)
				deferred.reject(err);
			else {
				if (guid) {
					results.guid = guid;
				}
				deferred.resolve(results);
			}
		});

		return deferred.promise;
	},
	findOne: function(parameters, options) {
		var deferred = Q.defer();
		options = options || {};

		var guid = null;
		if (options.guid) {
			guid = options.guid;
			delete options.guid;
		}

		var privateLabel = false;
		if (_.has(parameters, 'privateLabel')) {
			privateLabel = parameters.privateLabel;
			delete parameters.privateLabel;
		}
		if (!privateLabel)
			parameters["specification ->> private_label_item"] = 0;
		// parameters = __addPrivateLabelQry(parameters, privateLabel);

		db.item.findOne(parameters, function(err, record) {
			if (err)
				deferred.reject(err);
			else {
				if (!record) {
					var errOpts = {
						statusCode: 401
					};
					if (guid) {
						errOpts.guid = guid;
					}
					deferred.reject(Err("Record Not Found", errOpts));
				} else {
					if (guid) {
						record.guid = guid;
					}
					deferred.resolve(record);
				}
			}
		});
		return deferred.promise;
	},
	findBySpecs: function(parameters, options) {
		var deferred = Q.defer();
		parameters = parameters || {};
		options = options || {};

		var gotCached = false;
		var respondingObj = {};
		var types = parameters.type;
		var fields = parameters.fields;
		delete parameters.fields;

		var privateLabel = false;
		if (_.has(parameters, 'privateLabel')) {
			privateLabel = parameters.privateLabel;
			delete parameters.privateLabel;
		}
		if (!privateLabel)
			parameters["specification ->> private_label_item"] = 0;
		// parameters = __addPrivateLabelQry(parameters, privateLabel);

		types.forEach(function(type, idx) {
			if (!_.has(respondingObj, type))
				respondingObj[type] = {};
			fields.forEach(function(field, idx) {
				if (!_.has(respondingObj[type], field))
					respondingObj[type][field] = [];
			});
		});

		/** If Cached, get the Cached Data Instead */
		var results = null;
		var key = JSON.stringify(parameters);
		if (Cache.has(key)) {
			results = Cache.get(key);
			gotCached = true;
 		}

        if (gotCached) {
        	log("Returning findBySpecs Cached Results.");
            deferred.resolve(results);
		} else {
			if (!privateLabel) {
				db.excludePrivateLabelItems({stream: true}, streamHandler);
			} else {
				db.includePrivateLabelItems(privateLabel, {stream: true}, streamHandler);
			}
		}

		function streamHandler(err, stream) {
			if (err)
				deferred.reject(err);
			else {
				stream.on('readable', function() {
					var item = stream.read();
					if (!item)
						return;

					var itemType = item.type;

					if (_.has(respondingObj, itemType)) {
						var field, value;
						/**
						 * First check the item column fields.
						 * This is where the bug was. Since some of the fields that are being
						 * passed are not located/are part of the item.specification object,
						 * we now need to check the item's higher level properties.
						 * Such as `part_number` is an item property not an item.specification.
						 */
						for (var p = 0; p < fields.length; p++) {
							field = fields[p];
							if (_.has(item, field)) {
								value = item[field];
								if (!value)
									continue;
								if (value && typeof value !== 'string')
									value = value.toString();
								if (_.isEmpty(value))
									continue;
								if (!_.contains(respondingObj[itemType][field], value))
									respondingObj[itemType][field].push(value);
							}
						}

						/** @type {Object} Now check Specifications */
						var specification = item.specification;

						/** Make sure not to include items if `privateLabel` was provided. */
						var itemIsPrivate = false;
						var itemIsProhibited = false;
						if (specification.private_label_item !== undefined)
							itemIsPrivate = specification.private_label_item === 1;
						if (privateLabel && itemIsPrivate) {
							var itemPrivateLabelCustomer = specification.private_label_customer_1;
							if (_.isEmpty(itemPrivateLabelCustomer))
								itemPrivateLabelCustomer = specification.private_label_customer_2;
							else if (itemPrivateLabelCustomer !== privateLabel)
								itemIsProhibited = true;
							else if (itemPrivateLabelCustomer === privateLabel)
								itemIsProhibited = false;

							if (_.isEmpty(itemPrivateLabelCustomer) || itemIsProhibited)
								itemPrivateLabelCustomer = specification.private_label_customer_3;
							else if (itemPrivateLabelCustomer !== privateLabel)
								itemIsProhibited = true;
							else if (itemPrivateLabelCustomer === privateLabel)
								itemIsProhibited = false;

							if (_.isEmpty(itemPrivateLabelCustomer) || itemIsProhibited)
								itemPrivateLabelCustomer = specification.private_label_customer_4;
							else if (itemPrivateLabelCustomer !== privateLabel)
								itemIsProhibited = true;
							else if (itemPrivateLabelCustomer === privateLabel)
								itemIsProhibited = false;

							if (_.isEmpty(itemPrivateLabelCustomer) || itemIsProhibited)
								itemPrivateLabelCustomer = specification.private_label_customer_5;
							else if (itemPrivateLabelCustomer !== privateLabel)
								itemIsProhibited = true;
							else if (itemPrivateLabelCustomer === privateLabel)
								itemIsProhibited = false;

							if (!_.isEmpty(itemPrivateLabelCustomer) || itemIsProhibited) {
								if (itemPrivateLabelCustomer !== privateLabel)
									itemIsProhibited = true;
								else if (itemPrivateLabelCustomer === privateLabel)
									itemIsProhibited = false;
							}

						}

						if (itemIsProhibited) {
							log("Denied Private Label Item (%s)", item.part_number);
							return;
						}

						/**
						 * Now finally we check the item.specification object for
						 * matching fields.
						 */
						for (var t = 0; t < fields.length; t++) {
							field = fields[t];
							if (!_.has(specification, field))
								continue;
							value = specification[field];
							if (!value)
								continue;
							if (value && typeof value !== 'string')
								value = value.toString();
							if (_.isEmpty(value))
								continue;
							if (!_.contains(respondingObj[itemType][field], value))
								respondingObj[itemType][field].push(value);
						}
					}
				});

				stream.on('end', function() {
					if (!_.isEmpty(respondingObj)) {
						key = JSON.stringify(parameters);
	                    /** @type {Array} We Cache the results for 5 minutes at a time. */
	                    Cache.set(key, respondingObj, {
	                        maxMinutes: 5
	                    });
					}
					deferred.resolve(respondingObj);
				});
			}
		}

		return deferred.promise;
	},
	save: function(data) {
		var deferred = Q.defer();
		db.item.save(data, function(err, item) {
			if (err)
				deferred.reject(err);
			else {
				deferred.resolve(item);
			}
		});
		return deferred.promise;
	},
	search: function(parameters, options, returnOptions) {
		var deferred = Q.defer();
		options = options || {};

		var privateLabel = false;
		var toReturn = false;
		if (returnOptions !== undefined)
			toReturn = returnOptions;

		if (parameters.privateLabel !== undefined)
			privateLabel = parameters.privateLabel;

		if (_.has(parameters, 'privateLabel'))
			delete parameters.privateLabel;

		if (!privateLabel)
			parameters["specification ->> private_label_item"] = 0;
		// parameters = __addPrivateLabelQry(parameters, privateLabel);

		db.item.search(parameters, function(err, docs) {
			if (err)
				deferred.reject(err);
			else {
				if (toReturn) {
					var resObj = _.extend({}, options);
					resObj.docs = docs;
					deferred.resolve(resObj);
				} else {
					deferred.resolve(docs);
				}
			}
		});
		return deferred.promise;
	},
	destroy: function(params, options) {
        var deferred = Q.defer();
        db.item.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    }
};

function __addPrivateLabelQry(parameters, privateLabel) {
	if (parameters.privateLabel !== undefined)
		delete parameters.privateLabel;
	/** Now we check if we can include private label items. If so, which ones. */
	if (!privateLabel) {
		parameters["specification ->> private_label_item"] = 0;
		return parameters;
	} else {
		parameters["specification ->> private_label_item"] = [0, 1];
		parameters["specification ->> private_label_customer_1"] = ['', privateLabel];
		return parameters;

		// var qryCondition = {
		// 	or: []
		// };

		// parameters["specification ->> private_label_item"] = [0, 1];
		// parameters["specification ->> private_label_customer_1"] = privateLabel;
		// var clonedParams = _.clone(parameters);
		// qryCondition.or.push(clonedParams);
		// delete parameters["specification ->> private_label_customer_1"];

		// parameters["specification ->> private_label_customer_2"] = privateLabel;
		// clonedParams = _.clone(parameters);
		// qryCondition.or.push(clonedParams);
		// delete parameters["specification ->> private_label_customer_2"];

		// parameters["specification ->> private_label_customer_3"] = privateLabel;
		// clonedParams = _.clone(parameters);
		// qryCondition.or.push(clonedParams);
		// delete parameters["specification ->> private_label_customer_3"];

		// parameters["specification ->> private_label_customer_4"] = privateLabel;
		// clonedParams = _.clone(parameters);
		// qryCondition.or.push(clonedParams);
		// delete parameters["specification ->> private_label_customer_4"];

		// parameters["specification ->> private_label_customer_5"] = privateLabel;
		// clonedParams = _.clone(parameters);
		// qryCondition.or.push(clonedParams);
		// delete parameters["specification ->> private_label_customer_5"];

		// return qryCondition;
	}
}