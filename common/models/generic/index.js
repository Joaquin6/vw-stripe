var Q = require("q"),
	_ = require("underscore"),
	Helprs = require("helprs"),
	db = require("libs/db");

module.exports = {
	clearCart: function(parameters, options) {
		var deferred = Q.defer();

		db.clearCart([parameters.id], function(err, response) {
			if (err)
				deferred.reject(err);
			else
				deferred.resolve(response);
		});

		return deferred.promise;
	},
	clearTableData: function(parameters, options) {
		var deferred = Q.defer();

		var missingParam = "Table",
			badParams = false;
		if (!parameters.schema || !parameters.table) {
			if (!parameters.schema && !parameters.table)
				missingParam += " and Schema";
			else if (!parameters.schema)
				missingParam = "Schema";
			badParams = true;
		}

		Q.delay(250).done(function() {
			if (badParams) {
				var err = Helprs.err("Must specify a " + missingParam, {
					statusCode: 1002,
					paramaters: parameters
				});
				deferred.reject(err);
			} else {
				db.clearTable([parameters.schema, parameters.table], function(err, response) {
					if (err)
						deferred.reject(err);
					else
						deferred.resolve(response);
				});
			}
		});

		return deferred.promise;
	},
	getLastWebOrderNumber: function() {
		var deferred = Q.defer();
		db.sales.getLastWebOrderNumber(function(err, WebOrderNumber) {
			if (err)
				deferred.reject(err);
			else
				deferred.resolve(WebOrderNumber);
		});
		return deferred.promise;
	},
	getLastWebOrderNumberByEnv: function(parameters) {
		var deferred = Q.defer();
		var envCode = parameters.envCode;
		envCode += '-%';
		db.getLastWebOrderNumberByEnv(envCode, function(err, WebOrderNumber) {
			if (err)
				deferred.reject(err);
			else {
				if (WebOrderNumber[0])
					deferred.resolve(WebOrderNumber[0].web_order_number);
				else {
					deferred.reject(Helprs.err("Record Not Found", {
						statusCode: 401,
						envCode: envCode
					}));
				}
			}
		});
		return deferred.promise;
	}
};