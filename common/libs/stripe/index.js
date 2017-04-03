var Q = require("q"),
	_ = require("underscore"),
	Helprs = require('helprs'),
	Moment = require('moment'),
	Stripe = require("stripe"),
	debug = require("libs/buglog"),
	log = debug("libs", "stripe");

var stripeMode = null;
var stripeConfigs = null;
var currentEnv = null;

var StripeAPIObject = {
	initialize: function(settings) {
		settings = settings || {};

		currentEnv = settings.environment;
		stripeMode = settings.stripe.mode;
		stripeConfigs = settings.stripe[stripeMode];

		Stripe = Stripe(stripeConfigs.keys.secret_key);

		Stripe.setApiVersion(stripeConfigs.version);

		log("\tInitialized");
	},
	/**
	 * Creates a single use token that wraps the details of a credit card.
	 * This token can be used in place of a credit card object with any API method.
	 * These tokens can only be used once:
	 * 		by creating a new charge object, or attaching them to a customer.
	 * @param   {[type]}  parameters  [description]
	 * @param   {[type]}  options     [description]
	 * @return  {[type]}              [description]
	 */
	requestCardToken: function(parameters, options) {
		var deferred = Q.defer();

		if (currentEnv === "development") {
			if (!options.card_number)
				options.card_number = "4242424242424242";
			if (!options.card_exp_month)
				options.card_exp_month = Helprs.exp_month({future: true});
			if (!options.card_exp_year)
				options.card_exp_year = Helprs.exp_year();
			if (!options.card_cvc)
				options.card_cvc = Helprs.cvc();
		}

		Stripe.tokens.create({
			card: {
				number: options.card_number,
				exp_month: parseInt(options.card_exp_month),
				exp_year: parseInt(options.card_exp_year),
				cvc: options.card_cvc
			}
		}, function(err, token) {
			// asynchronously called
			if (err) {
				__handleStripeError(err);
				deferred.reject(err);
			} else {
				deferred.resolve(token);
			}
		});

		return deferred.promise;
	},
	/**
	 * To charge a credit card, you create a charge object.
	 * If your API key is in test mode, the supplied payment source (e.g., card or Bitcoin receiver)
	 * won't actually be charged, though everything else will occur as if in live mode.
	 * (Stripe assumes that the charge would have completed successfully).
	 * @param   {Object}  parameters  [description]
	 * @param   {Object}  options     [description]
	 * @return  {Object}              Returns a charge object if the charge succeeded.
	 *                                Throws an error if something goes wrong.
	 *                                A common source of error is an invalid or expired card, or a valid card
	 *                                with insufficient available balance. If the cvc parameter is provided,
	 *                                Stripe will attempt to check the CVC's correctness, and the check's result
	 *                                will be returned. Similarly, if address_line1 or address_zip are provided,
	 *                                Stripe will try to check the validity of those parameters.
	 *                                Some banks do not support checking one or more of these parameters,
	 *                                in which case Stripe will return an 'unavailable' result.
	 *                                Also note that, depending on the bank, charges can succeed even when passed
	 *                                incorrect CVC and address information.
	 */
	submitPayment: function(parameters, options) {
		var deferred = Q.defer();

		if (!__validateParameters(parameters)) {
			var validationError = Helprs.err('Parameters are Not Valid', {
				statusCode: 401,
				parameters: parameters,
				options: options
			});
			deferred.reject(validationError);
		}

		var chargeParams = {
			amount: parameters.amount,
			currency: parameters.currency,
			capture: false,
			metadata: {}
		};

		if (parameters.description)
			chargeParams.description = parameters.description;

		chargeParams.metadata = _.extend(chargeParams.metadata, {
			po_number: options.po_number,
			web_order_number: options.web_order_number
		});

		Q.when(__getStripeCardToken(parameters, options), function(token) {
			chargeParams.source = token.id;
			Stripe.charges.create(chargeParams, function(err, charge) {
				// asynchronously called
				if (err) {
					__handleStripeError(err);
					deferred.reject(err);
				} else {
					deferred.resolve(charge);
				}
			});
		}, function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	}
};

module.exports = StripeAPIObject;

function __handleStripeError(err) {
	var errorType = err.type || err.rawType;
	switch (errorType) {
		case "card_error":
		case 'StripeCardError':
			if (!err.message)
				err.message = "Card errors are the most common type of error you should expect to handle. They result when the user enters a card that can't be charged for some reason.";
			break;
		case "rate_limit_error":
		case 'RateLimitError':
			if (!err.message)
				err.message = "Too many requests made to the API too quickly";
			break;
		case "invalid_request_error":
		case 'StripeInvalidRequestError':
			if (!err.message)
				err.message = "Invalid request errors arise when your request has invalid parameters.";
			if (err.message.indexOf("the maximum 25 current subscriptions") > -1) {
				err.message = "You have reached the maximum of 25 active subscriptions! You were not charged for this transaction!";
				err.title = "Maximum Limit Reached";
			}
			if (err.message.indexOf("No such customer:") > -1)
				err.title = "Customer Does Not Exists";
			break;
		case "api_error":
		case 'StripeAPIError':
			if (!err.message)
				err.message = "API errors cover any other type of problem (e.g., a temporary problem with Stripe's servers) and are extremely uncommon.";
			break;
		case "api_connection_error":
		case 'StripeConnectionError':
			if (!err.message)
				err.message = "Failure to connect to Stripe\'s API.";
			break;
		case "authentication_error":
		case 'StripeAuthenticationError':
			if (!err.message)
				err.message = "Failure to properly authenticate yourself in the request.";
			break;
		default:
			if (!err.message)
				err.message = "Handle any other types of unexpected errors";
			break;

		var time = (new Date()).toLocaleString();
	    console.log("\n================ " + time + " ===================\n");

	    if (err.stack) {
	        console.log(colors.yellow(">>> WARNING: Long Stack Traces <<<"));
	        console.log(err.stack);
	    }

	    console.log(colors.red("\n!!! Stripe Error " + err.type + ": " + err.message + "\n"));
	    console.log("\n================ " + time + " ===================\n");
	}
}

function __validateParameters(parameters) {
	if (!parameters.amount)
		return false;
	if (!parameters.currency)
		parameters.currency = "usd";

	// if (currentEnv === "development") {
	// 	/**
	// 	 * Description is NOT required by Stripe.
	// 	 * All w are doing here is saying, IF we are in DEV and
	// 	 * no description was supplied we can just mock one. This will ONLY
	// 	 * happen during DEV mode.
	// 	 */
	// 	if (!parameters.description)
	// 		parameters.description = Helprs.paragraph();

	// 	/** Shipping information for the charge. */
	// 	if (!parameters.shipping)
	// 		parameters.shipping = {};
	// 	/** Shipping address. */
	// 	if (!parameters.shipping.address) {
	// 		parameters.shipping.address = {
	// 			line1: Helprs.address(),
	// 			city: Helprs.city({capitalize: true}),
	// 			state: Helprs.state({country: 'us'}),
	// 			postal_code: Helprs.zip(),
	// 			country: "US"
	// 		};
	// 	}
	// 	/** Required Shipping Name Parameter. */
	// 	if (!parameters.shipping.name)
	// 		parameters.shipping.name = Helprs.name();
	// 	/**
	// 	 * The delivery service that shipped a physical product,
	// 	 * such as Fedex, UPS, USPS, etc.
	// 	 * @type  {String}
	// 	 */
	// 	if (!parameters.shipping.carrier)
	// 		parameters.shipping.carrier = "UPS";
	// 	if (!parameters.shipping.phone) {
	// 		parameters.shipping.phone = Helprs.phone({
	// 			formatted: false
	// 		});
	// 	}
	// 	/**
	// 	 * The tracking number for a physical product,
	// 	 * obtained from the delivery service. If multiple tracking
	// 	 * numbers were generated for this purchase, please separate them with commas.
	// 	 * @type  {String}
	// 	 */
	// 	if (!parameters.shipping.tracking_number) {
	// 		parameters.shipping.tracking_number = Helprs.string({
	// 			max: 15
	// 		});
	// 	}
	// }

	return true;
}

function __getStripeCardToken(parameters, options) {
	var deferred = Q.defer();
	parameters = parameters || {};
	options = options || {};

	if (!parameters.token || (!parameters.token && currentEnv === "development")) {
		StripeAPIObject.requestCardToken(parameters, options).then(function(token) {
			deferred.resolve(token);
		}).fail(function(err) {
			deferred.reject(err);
		}).done();
	} else {
		deferred.resolve(parameters.token);
	}

	return deferred.promise;
}