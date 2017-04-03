var Q = require("q"),
    _ = require("underscore"),
    Helprs = require("helprs"),
    db = require("libs/db"),
    Item = require("models/public/item");

require("clarify");

module.exports = {
    get: function(params, options) {
        var deferred = Q.defer();
        params = params || {};
        options = options || {};
        var that = this;

        db.membership.dealer.findDoc(params, options, function(err, doc) {
            if (err) {
                deferred.reject(err);
            } else {
                if (options.addMethods) {
                    if (doc[0]) {
                        doc = doc[0];
                    }
                    that.__addMethods(doc).then(function(methodDoc) {
                        deferred.resolve(methodDoc);
                    }).fail(function(err) {
                        deferred.reject(err);
                    }).done();
                } else {
                    deferred.resolve(doc);
                }
            }
        });
        return deferred.promise;
    },
    getPricing: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        this.__getPricing(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    /**
     * Method to get Dealer Specific Pricing for the specified Item.
     *
     * @param   {Object}  parameters  Object Containing the Dealer's ID and Item ID.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     id: 123,
     *     item: 465456
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {String}              The Actual Dollar Amount
     */
    getPricingPerItem: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        this.__getPricingPerItem(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    find: function(params, options) {
        var deferred = Q.defer();
        var guid = null;
        options = options || {};
        if (options.guid) {
            guid = options.guid;
            delete options.guid;
        }

        db.membership.dealer.find(params, options, function(err, result) {
            if (err)
                deferred.reject(err);
            else {
                if (guid) {
                    result.guid = guid;
                }
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    },
    findOne: function(params, options) {
        var deferred = Q.defer();
        var guid = null;
        options = options || {};
        if (options.guid) {
            guid = options.guid;
            delete options.guid;
        }

        db.membership.dealer.findOne(params, options, function(err, record) {
            if (err)
                deferred.reject(err);
            else {
                if (!record) {
                    var errOpts = {
                        errorCode: 1000,
                        statusCode: 401
                    };
                    if (guid) {
                        errOpts.guid = guid;
                    }
                    deferred.reject(Helprs.err("Record Not Found", errOpts));
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
    save: function(data) {
        var deferred = Q.defer();
        data.created = data.updated = new Date();
        db.membership.dealer.save(data, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    },
    search: function(params, options, returnOptions) {
        var deferred = Q.defer();
        var toReturn = false;
        if (returnOptions !== undefined)
            toReturn = returnOptions;
        options = options || {};

        db.membership.dealer.search(params, function(err, docs) {
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
    update: function(data) {
        var deferred = Q.defer();
        data.updated = new Date();
        db.membership.dealer.save(data, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    },
    destroy: function(params, options) {
        var deferred = Q.defer();
        db.membership.dealer.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    },
    __getPricing: function(parameters, options) {
        var deferred = Q.defer();

        this.__validateDealerPricing(parameters, options, function(err, items) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(items);
            }
        });

        return deferred.promise;
    },
    __getPricingPerItem: function(parameters, options) {
        var deferred = Q.defer();

        /** We are mocking data for now. */
        Q.delay(1500).done(function() {
            deferred.resolve(Helprs.dollar({max: 350}));
        });

        return deferred.promise;
    },
    __validateDealerPricing: function(parameters, options, callback) {
        var that = this;
        /**
         * First, check if `parameters.items` is defined. If so, we get dealer pricing
         * on each of the `parameters.items` in question. If `parameters.items` is not
         * defined (undefined or empty array) we reject the promise.
         */
        if (!parameters.items || parameters.items.length === 0) {
            var err = Helprs.err("No Items Provided for Dealer Pricing", {
                statusCode: 401
            });
            callback(err);
        } else {
            var dealerID = parameters.id;
            var pricingItems = parameters.items;
            if (!_.isArray(pricingItems)) {
                pricingItems = _.allKeys(pricingItems);
            }

            var priceOptions = {
                items: parameters.items,
                price: Helprs.dollar({min: 50, max: 350})
            };
            var items = [], promises = [];
            for (var f = 0; f < pricingItems.length; f++) {
                var promise = this.__getDealerPricingPerItem({dealer_id: dealerID, item_id: pricingItems[f]}, priceOptions).then(function(item) {
                    items.push(item);
                });
                promises.push(promise);
            }

            Q.allSettled(promises).then(function(results) {
                var isError = false,
                    errorResult;
                results.forEach(function(result) {
                    if (result.state !== 'fulfilled') {
                        isError = true;
                        errorResult = result;
                    }
                });

                if (isError) {
                    console.log(colors.red("!!! " + errorResult.reason));
                    errorResult.message = errorResult.reason;
                    return callback(errorResult);
                }

                callback(null, items);
            }).done();
        }
    },
    __getDealerPricingPerItem: function(parameters, options) {
        var deferred = Q.defer();
        this.getPricingPerItem({id: parameters.dealer_id, item: parameters.item_id}).then(function(price) {
            var item = {};

            if (!_.isArray(items)) {
                item = items[parameters.item_id];
            }

            if (!item.id) {
                item.id = parameters.item_id;
            }

            if (!item.price) {
                item.price = {};
            }

            item.price.dealer = price;

            deferred.resolve(item);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    }
};