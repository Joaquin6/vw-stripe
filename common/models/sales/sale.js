var Q = require("q"),
    _ = require("underscore"),
    Helprs = require("helprs"),
    Moment = require('moment'),
    db = require("libs/db"),
    debug = require("libs/buglog"),
    log = debug("models", "sale");

module.exports = {
    find: function(params, options) {
        var deferred = Q.defer();
        var guid = null;
        options = options || {};
        if (options.guid) {
            guid = options.guid;
            delete options.guid;
        }

        db.sales.sale.find(params, options, function(err, sales) {
            if (err)
                deferred.reject(err);
            else {
                if (guid) {
                    sales.guid = guid;
                }
                deferred.resolve(sales);
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

        db.sales.sale.findOne(params, function(err, record) {
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
        db.sales.sale.save(data, function(err, sale) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(sale);
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

        db.sales.sale.search(params, function(err, docs) {
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
        db.sales.sale.save(data, function(err, sale) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(sale);
            }
        });
        return deferred.promise;
    },
    destroy: function(params, options) {
        var deferred = Q.defer();
        db.sales.sale.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    }
};