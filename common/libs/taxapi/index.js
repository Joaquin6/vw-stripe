/**
 * @fileOverview This file is an application libs wrapper for the Tax Rates API.
 * @author Joaquin Briceno <joaquin.briceno@mirumshopper.com>
 */

var Q = require("q"),
	_ = require("underscore"),
	colors = require('colors'),
	Helprs = require('helprs'),
	Cache = require("libs/helpers/cache"),
    Taxrates = require('libs/helpers/taxrates'),
    debug = require("libs/buglog"),
    log = debug("libs", "taxapi");

var taxAPIObject = {
	taxRatesAPI: null,
	getTaxRateByAddress: function(parameters, options) {
		var deferred = Q.defer();
		options = options || {};
		parameters = parameters || {};

        __requestHandler(parameters, options, "address").then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

		return deferred.promise;
	},
	getTaxRateByZip: function(parameters, options) {
		var deferred = Q.defer();
		options = options || {};
		parameters = parameters || {};

        __requestHandler(parameters, options, "postal").then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

		return deferred.promise;
	}
};

/** @module Taxapi */
module.exports = taxAPIObject;

/**
 * @private
 * Function that handles the request for both `byAddress` and `byZipcode`.
 * Both methods do exactly the same thing. The only difference is the amount of validation
 * that occurs on the `byAddress` method because it requires additional parameters. So to avoid
 * code duplication, they both take advantage of this one function handling the requests.
 * This handler is passed in a requestType parameter which allows it to determine what type of
 * request to make.
 *
 * @param   {Object}  parameters   Required parameters that will be validated depending on the Request Type.
 * @param   {Object}  options      Options object that will determine the outcome.
 * @param   {String}  requestType  The type of request to make, either by address or by zipcode.
 * @return  {Object}               Upon successfully completing the promise, it returns a response with the tax rate details.
 */
function __requestHandler(parameters, options, requestType) {
    var deferred = Q.defer();

    var apiKey = __getAPIKey();

    parameters.postal = __validatePostalCode(parameters);
    parameters.country = __validateCountryCode(parameters);

    /** First we check if the Value is already Cached. */
    var cacheTitle = __generateCacheTitle(parameters);
    if (cacheTitle && Cache.has(cacheTitle)) {
        log("\n\n===================================\n\n");
        log("\nReturning Data from CACHE");
        log("\n\tPostal: " + parameters.postal);
        log("\n\tCountry: " + parameters.country);
        log("\n\n===================================\n\n");

        var res = Cache.get(cacheTitle);
        var responding = __getResponseObject(res, parameters);

        for (var i in res.rates) {
            var currentRate = res.rates[i];
            if (responding.type === currentRate.type) {
                if (currentRate.type === "Special")
                    responding.rate += currentRate.rate;
                else
                    responding.rate = currentRate.rate;
            }
        }
        deferred.resolve(responding);
    } else {
        var promise = null;
        if (requestType === "address")
            promise = Taxrates.taxByAddress(apiKey, parameters.street, parameters.city, parameters.state, parameters.country, parameters.postal);
        else
            promise = Taxrates.taxByZip(apiKey, parameters.country, parameters.postal);

        promise.then(function(res) {
            var responding = __getResponseObject(res, parameters);

            log("\nConfigured Rate Type: " + colors.yellow(responding.type));
            log("\nTotal Rate: " + res.totalRate);
            log("\nBreakdown...: ");
            for (var i in res.rates) {
                var currentRate = res.rates[i];
                log("\n\nRate " + (parseInt(i) + 1));
                log("Rate: " + currentRate.rate);
                log("Name: " + currentRate.name);
                log("Type: " + currentRate.type);

                if (responding.type === currentRate.type) {
                    /**
                     * We have to handle Rate Type `Special` differently because according to previous
                     * responses, there can be multiple rates with the same type property value of `Special`.
                     *
                     * If rate type is `Special` there should be no reason why the `responding.rate` value
                     * should have any other value at the moment than `0`. If it does have more than `0` this means
                     * previous iterated `Special` rate types have added to it.
                     */
                    if (currentRate.type === "Special")
                        responding.rate += currentRate.rate;
                    else
                        responding.rate = currentRate.rate;
                }

                /**
                 * Now we cache the response with the State.
                 * We cache the response object for a maximum amount of 1 minute.
                 * This will help us control the amount of requests being sent to Avalara
                 * since they are limiting us to 15 requests per minute.
                 */
                if (currentRate.type === "State") {
                    var cacheTitle = __generateCacheTitle(_.extend(currentRate, res.parameters));
                    if (cacheTitle) {
                        Cache.set(cacheTitle, res, {
                            maxMinutes: 5
                        });
                    }
                }
            }
            //print a separator after each API call result set
            log("\n\n===================================\n\n");

            deferred.resolve(responding);
        }).fail(function(err) {
            log("\nERROR:\n");
            log("Code: " + err.code);
            log("Message: " + err.message);
            log("Parameters:\n");
            log(err.parameters);
            deferred.reject(err);
        }).done();
    }

    return deferred.promise;
}
/** @private */
function __validateCachedSettings() {
    if (Cache.has("TaxRatesAPI")) {
        taxAPIObject.taxRatesAPI = Cache.get("TaxRatesAPI");
        Cache.clear("TaxRatesAPI");
    }
}
/** @private */
function __validatePostalCode(parameters) {
    var postal = parameters.postal;
    if (postal && typeof postal === "number")
        postal = postal.toString();

    // This will simply take in the postal code and make sure
    // it is a valid postal code for the country provided. If not country is provided,
    // this method defaults to "USA".
    // postal = Helprs.validatePostalCode(postal, {
    //     country: parameters.country
    // });

    if (postal)
        return postal;

    var wrn = "\n" + colors.yellow("TAX API WARNING") + ": Postal Code (" + colors.yellow(parameters.postal) + ") did not match any Registered Postal Code.";
    wrn += "\n\tThis may result in an ERROR from the Tax API.";
    log(wrn);

    return parameters.postal;
}
/** @private */
function __validateCountryCode(parameters) {
    var country = parameters.country;
    var ctry = Helprs.countryToISO3(country);
    if (ctry.iso3)
        return ctry.iso3;
    var wrn = "\n" + colors.yellow("TAX API WARNING") + ": Country Code (" + colors.yellow(country) + ") did not match a Standard ISO3 Country Code.";
    wrn += "\n\tThis may result in an ERROR from the Tax API.";
    log(wrn);
    return country;
}
/** @private */
function __getAPIKey() {
    if (taxAPIObject.taxRatesAPI)
        return taxAPIObject.taxRatesAPI.key;
    __validateCachedSettings();
    return taxAPIObject.taxRatesAPI.key;
}
/** @private */
function __getAPIRateType() {
    if (taxAPIObject.taxRatesAPI)
        return taxAPIObject.taxRatesAPI.type;
    __validateCachedSettings();
    return taxAPIObject.taxRatesAPI.type;
}
/** @private */
function __generateCacheTitle(params) {
    var cacheTitle = "Taxapi";
    var options = params.country !== "USA" ? {country: params.country} : {};
    var stateAbbr = params.state || null;
    if (params.name) {
        stateAbbr = Helprs.getAbbrStateName(params.name, options);
    } else if (!stateAbbr && params.postal) {
        options.byPostal = true;
        options.postal = params.postal;
        stateAbbr = Helprs.getAbbrStateName(null, options);
    }

    if (!stateAbbr)
        return null;

    cacheTitle += stateAbbr + params.postal;

    cacheTitle = cacheTitle.replace(" ", "").trim();

    return cacheTitle;
}
/** @private */
function __getResponseObject(res, parameters) {
    var responding = {
        type: __getAPIRateType(),
        rate: 0,
        postal: res.parameters.postal || parameters.postal || null,
        country: res.parameters.country || parameters.country || null
    };

    if (res.parameters.street || parameters.street)
        responding.street = res.parameters.street || parameters.street;
    if (res.parameters.city || parameters.city)
        responding.city = res.parameters.city || parameters.city;
    if (res.parameters.state || parameters.state)
        responding.state = res.parameters.state || parameters.state;

    if (responding.type === "totalRate")
        responding.rate = res.totalRate;

    return responding;
}