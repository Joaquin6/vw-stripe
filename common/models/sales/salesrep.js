var Q = require("q"),
    _ = require("underscore"),
    Helprs = require("helprs"),
    db = require("libs/db"),
    debug = require("libs/buglog"),
    Cache = require("libs/helpers/cache"),
    log = debug("models", "salesrep");

module.exports = {
    get: function(params, options) {
        var deferred = Q.defer();
        params = params || {};
        options = options || {};
        var that = this;
        db.sales.salesrep.findDoc(params, options, function(err, doc) {
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
    find: function(params, options) {
        var deferred = Q.defer();
        var guid = null;
        options = options || {};
        if (options.guid) {
            guid = options.guid;
            delete options.guid;
        }

        /** If Cached, get the Cached Data Instead */
        if (_.isEmpty(params) && Cache.has("AllSalesreps")) {
            var results = Cache.get("AllSalesreps");
            if (guid)
                results.guid = guid;
            log("Returning Cached Results.");
            deferred.resolve(results);
        } else {
            db.sales.salesrep.find(params, options, function(err, results) {
                if (err)
                    deferred.reject(err);
                else {
                    if (_.isEmpty(params)) {
                        /** @type {Array} We Cache the results for 5 minutes at a time. */
                        Cache.set("AllSalesreps", results, {
                            maxMinutes: 5
                        });
                    }
                    if (guid)
                        results.guid = guid;
                    deferred.resolve(results);
                }
            });
        }

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

        db.sales.salesrep.findOne(params, options, function(err, record) {
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
        db.sales.salesrep.save(data, function(err, salerep) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(salerep);
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

        db.sales.salesrep.search(params, function(err, docs) {
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
        db.sales.salesrep.save(data, function(err, salerep) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(salerep);
            }
        });
        return deferred.promise;
    },
    destroy: function(params, options) {
        var deferred = Q.defer();
        db.sales.salesrep.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    }
};