var Q = require("q"),
    _ = require("underscore"),
    Moment = require('moment'),
    db = require("libs/db");

require("clarify");

module.exports = {
    get: function(params, options) {
        var deferred = Q.defer();
        params = params || {};
        options = options || {};
        var that = this;
        db.sales.sale_item.findDoc(params, options, function(err, doc) {
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

        db.sales.sale_item.find(params, options, function(err, result) {
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
    save: function(data) {
        var deferred = Q.defer();
        db.sales.sale_item.save(data, function(err, saleItem) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(saleItem);
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

        db.sales.sale_item.search(params, function(err, docs) {
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
        db.sales.sale_item.save(data, function(err, saleItem) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(saleItem);
            }
        });
        return deferred.promise;
    },
    destroy: function(params, options) {
        var deferred = Q.defer();
        db.sales.sale_item.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    }
};