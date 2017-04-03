/**
 *  Avalara TaxRates.com API Helper
 *
 *  This helper assists you in making REST API calls to the Avalara TaxRates
 *  API to get tax rates for a street address or zip/postal code in the US or Canada.
 */
var Q = require('q'),
	https = require('https'),
	Helprs = require('helprs');

var errors = {
	"BAD_COUNTRY_ADDR": "\nTaxByAddress failed because the country code did not match our current list of ISO 3166-1 alpha-3 codes. Please make sure you are providing a 3-letter country code like USA or CAN.\n\n",
	"CALLBACK_NOT_FUNCTION": "\nTaxByAddress/TaxByZip failed because the callback was not a function.\n\n",
	"STREET_ERROR": "\nTaxByAddress failed because the street address was either not a string or was too short (< 5 chars)\n\n",
	"STATE_ERROR": "\nTaxByAddress failed because the state was either not a string or was too short (< 2 chars)\n\n",
	"ZIP_ERROR": "\nTaxByZip failed because the zip code must be between 5-10 chars\n\n",
	"BAD_COUNTRY_ZIP": "\nTaxByZip failed because the country code did not match our current list of ISO 3166-1 alpha-3 codes. Please make sure you are providing a 3-letter country code like USA or CAN.\n\n",
};

var TaxRatesObject = {
	/**
	 * @method taxByZip
	 *
	 * @param string APIKey : REQUIRED : your TaxRates.com API Key
	 * @param string country : REQUIRED : Country code in ISO 3166-1 alpha-3 format (e.g. "USA")
	 * @param string postal : OPTIONAL : zip code of the address
	 */
	taxByZip: function(APIKey, country, postal) {
		var deferred = Q.defer();

		var state = Helprs.getStateByPostal(postal);

		__taxByZip(APIKey, state, country, postal, function(res) {
			if (res.error)
				deferred.reject(res);
			else
				deferred.resolve(res);
		});

		return deferred.promise;
	},
	/**
	 * @method taxByAddress
	 *
	 * @param string APIKey : REQUIRED : your TaxRates.com API Key
	 * @param string street : REQUIRED : first line of the address, e.g. "1101 Alaskan Way"
	 * @param string city : OPTIONAL : City of the address
	 * @param string state : REQUIRED : State or region (e.g "WA" or "Washington")
	 * @param string country : REQUIRED : Country code in ISO 3166-1 alpha-3 format (e.g. "USA")
	 * @param string postal : OPTIONAL : zip code of the address
	 */
	taxByAddress: function(APIKey, street, city, state, country, postal) {
		var deferred = Q.defer();

		__taxByAddress(APIKey, street, city, state, country, postal, function(res) {
			if (res.error)
				deferred.reject(res);
			else
				deferred.resolve(res);
		});

		return deferred.promise;
	}
};

module.exports = TaxRatesObject;

/** @private */
function __taxByZip(APIKey, state, country, postal, callback) {
	//*********VALIDATE INPUTS************
	country = __validateCountry(country);
	if (country === "ERR") {
		__errorDeath(errors.BAD_COUNTRY_ZIP, arguments)
	}
	if ((postal.length > 10) || (postal.length < 5)) {
		__errorDeath(errors.ZIP_ERROR, arguments);
	};

	// build request url
	var requri = "https://taxrates.api.avalara.com/postal?country=" + country;
	requri += "&postal=" + encodeURIComponent(postal);
	requri += "&apikey=" + encodeURIComponent(APIKey);

	var parameters = {
		taxBy: "postal",
		state: state,
		country: country,
		postal: postal,
		requri: requri
	};

	https.get(requri, function(res) {
		__processResponse(res, parameters, callback);
	});
}
/** @private */
function __taxByAddress(APIKey, street, city, state, country, postal, callback) {
	//*******VALIDATE INPUTS*******
	if (typeof callback !== "function") {
		__errorDeath(errors.CALLBACK_NOT_FUNCTION, arguments);
	}

	country = __validateCountry(country);
	if (country === "ERR") {
		__errorDeath(errors.BAD_COUNTRY_ADDR, arguments)
	}

	if ((typeof street !== "string") || (street.length < 5)) {
		__errorDeath(errors.STREET_ERROR, arguments);
	}

	if ((typeof state !== "string") || (state.length < 2)) {
		__errorDeath(errors.STATE_ERROR, arguments);
	}

	//we need to submit the postal code as a string, so if it's a number convert it
	//if it's not a string or not conforming after that, we'll throw it out since it's
	//optional and there's no point in throwing an exception and killing the call over it

	if (typeof postal === "number") postal = postal.toString();
	if (typeof postal !== "string") {
		postal = undefined;
	} else {
		if ((postal.length > 10) || (postal.length < 5)) postal = undefined;
	}

	// 	//same with city - it's optional... so kill it if it's not a string or if it's over 80 chars

	if (typeof city !== "string") {
		city = undefined;
	} else if (city.length > 80) {
		city = undefined;
	}

	//build request url
	var requri = "https://taxrates.api.avalara.com/address?country=" + country;
	requri += "&state=" + encodeURIComponent(state);
	if (typeof city !== "undefined") requri += "&city=" + encodeURIComponent(city);
	if (typeof postal !== "undefined") requri += "&postal=" + encodeURIComponent(postal);
	requri += "&street=" + encodeURIComponent(street);
	requri += "&apikey=" + encodeURIComponent(APIKey);

	var parameters = {
		taxBy: "address",
		street: street,
		city: city,
		state: state,
		country: country,
		postal: postal,
		requri: requri
	};

	https.get(requri, function(res) {
		__processResponse(res, parameters, callback);
	});
}
/**
 * @method __processResponse
 * @param object response : result that comes back from the https get
 * @param function callback : callback function from calling code
 * @return a JavaScript object containing the totalRate and array of the individual rates that contribute to that total.
 *
 * Processes responses that come back with a 200 code
 */
function __processResponse(response, parameters, callback) {

	if (response.statusCode !== 200) {
		return (__processError(response, parameters, callback));
	}

	response.on("data", function(d) {
		var data = d.toString();
		data = JSON.parse(data);
		data.error = false;
		data.parameters = parameters;
		return (callback(data));
	});
}
/**
 * @method __processError
 * @param object res : result that comes back from the https get
 * @param function callback : callback function from calling code
 * @return object data : contains data about the error
 *
 * Processes any response that doesn't come back with a 200 status code
 *
 */
function __processError(res, parameters, callback) {

	var messages = {
		400: "Unable to resolve request. Likely one or more pieces of data (street address, city, state, country, or API Key) was invalid.",
		401: "Authorization Failed: No API Key was provided or you provided more than one form of ID for authentication",
		429: "Rate limit exceeded, i.e. you are sending too many requests too fast. Please slow down and/or try again later."
	}

	if (typeof messages[res.statusCode] === undefined) {
		messages[res.statuscode] = "Unknown Error. Please contact Avalara with error code: " + res.statuscode;
	}

	var data = {
		error: true,
		code: res.statusCode,
		message: messages[res.statusCode],
		parameters: parameters
	};

	return (callback(data));
}
/**
 * @method __errorDeath(e)
 *
 * Throws exception with an error message when triggered by bad input during
 * validation.
 *
 * @param	e	Error message
 * @retutn none -
 *
 */
function __errorDeath(e, argarray) {
	console.log("\n\n***********************************************");
	console.log("DEBUG INFO: Arguments\n");
	console.log(argarray);
	console.log("***********************************************\n\n");
	throw new Error(e);
}
/**
 * @private
 * @method __validateCountry(code)
 * @param string code : should be a three-char ISO-3166-1 alpha-3 country identifier
 * @return string : the submitted code if valid or "ERR"" if not
 *
 * Contains a list of country identifiers accurate as of August 2015 and checks
 * the incoming code for validity
 *
 */
function __validateCountry(code) {
	var countries = Helprs.countries({arrayOfISO3: true});

	//ensures code is in all caps, compares to array, returns code if valid, ERR if not
	code = code.toUpperCase();
	code = (countries.indexOf(code) === -1) ? "ERR" : code;
	return code;
}