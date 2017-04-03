var Q = require("q"),
    _ = require("underscore"),
    Err = require("custom-err"),
    db = require("libs/db");

module.exports = {
    get: function(params, options) {
        var deferred = Q.defer();
        params = params || {};
        options = options || {};

        db.product.find(params, options, function(err, doc) {
            if (err)
                deferred.reject(err);
            else
                deferred.resolve(doc);
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

        db.product.find(params, function(err, result) {
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

        db.product.findOne(params, function(err, record) {
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
    save: function(data) {
        var deferred = Q.defer();
        db.product.save(data, function(err, product) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(product);
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

        db.product.search(params, function(err, records) {
            if (err)
                deferred.reject(err);
            else {
                if (toReturn) {
                    var resObj = _.extend({}, options);
                    resObj.records = records;
                    deferred.resolve(resObj);
                } else {
                    deferred.resolve(records);
                }
            }
        });
        return deferred.promise;
    },
    destroy: function(params, options) {
        var deferred = Q.defer();
        db.product.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    }
};