var Q = require("q"),
    _ = require("underscore"),
    Helprs = require("helprs"),
    db = require("libs/db");

module.exports = {
    find: function(params, options) {
        var deferred = Q.defer();
        params = params || {};
        options = options || {};
        db.membership.login.find(params, options, function(err, doc) {
            if (err)
                deferred.reject(err);
            else
                deferred.resolve(doc);
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

        db.membership.login.findOne(params, options, function(err, record) {
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
        if (!data.last_accessed)
            data.last_accessed = new Date();
        db.membership.login.save(data, function(err, login) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(login);
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

        db.membership.login.search(params, function(err, docs) {
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
        if (!data.last_accessed)
            data.last_accessed = new Date();
        db.membership.login.save(data, function(err, login) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(login);
            }
        });
        return deferred.promise;
    },
    destroy: function(params, options) {
        var deferred = Q.defer();
        db.membership.login.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    }
};