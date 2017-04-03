var Q = require("q"),
    _ = require("underscore"),
    Helprs = require("helprs"),
    db = require("libs/db");

module.exports = {
    count: function(parameters, options) {
        var deferred = Q.defer();
        db.membership.user.count(parameters, function(err, results) {
            if (err)
                deferred.reject(err);
            else {
                if (typeof results === 'string')
                    results = parseInt(results);
                if (!results)
                    deferred.reject(results);
                else
                    deferred.resolve(results);
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

        db.membership.user.find(params, options, function(err, result) {
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

        db.membership.user.findOne(params, options, function(err, record) {
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
        db.membership.user.save(data, function(err, user) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(user);
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

        db.membership.user.search(params, function(err, docs) {
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
    /**
     * Update a data row.
     * @param   {Object}  data  Object containing the row to update.
     *                          NOTE: You must provide the row ID to update.
     *                          Else Massive will think its a new record instead of an update.
     * @return  {[type]}        [description]
     */
    update: function(data) {
        var deferred = Q.defer();

        if (!data.id) {
            var hintMsg = "You MUST pass an `id` as a parameter.";
            hintMsg += "\nThis ID will be used to execute an UPDATE.";
            hintMsg += "\nWithout the ID, Massive will attempt to create a new record instead of updating an existing one.";
            var err = Helprs.err("No row ID was specified.", {
                statusCode: 1002,
                paramaters: data,
                hintMessage: hintMsg
            });
            return deferred.reject(err);
        }
        data.updated = new Date();
        db.membership.user.save(data, function(err, user) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(user);
            }
        });
        return deferred.promise;
    },
    destroy: function(params, options) {
        var deferred = Q.defer();
        db.membership.user.destroy(params, function(err, dealer) {
            if (err)
                deferred.reject(err);
            else {
                deferred.resolve(dealer);
            }
        });
        return deferred.promise;
    }
};