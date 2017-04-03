var Q = require("q"),
	request = require('superagent'),
	debug = require("libs/buglog"),
	log = debug("libs", "shipping_calculator");

var ShippingCalculatorObject = {
	request: function(parameters, options) {
		var deferred = Q.defer();
		options = options || {};

		log("Posting Parameters");
		log(parameters);

		request.post("https://q4ck4tmdth.execute-api.us-east-1.amazonaws.com/prod/VWShippingCalculator")
			.send(parameters).end(function(err, response) {
				if (err)
					deferred.reject(err);
				else
					deferred.resolve(response.body);
			});

		return deferred.promise;
	}
};

module.exports = ShippingCalculatorObject;