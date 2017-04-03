/**
 * A Note on Rounds
 * When you are hashing your data the module will go through a series of rounds to give you a secure hash.
 * The value you submit there is not just the number of rounds that the module will go through to hash your data.
 * The module will use the value you enter and go through 2^rounds iterations of processing.
 *
 * On a 2GHz core you can roughly expect:
 * ```js
 * rounds=8 : ~40 hashes/sec
 * rounds=9 : ~20 hashes/sec
 * rounds=10: ~10 hashes/sec
 * rounds=11: ~5  hashes/sec
 * rounds=12: 2-3 hashes/sec
 * rounds=13: ~1 sec/hash
 * rounds=14: ~1.5 sec/hash
 * rounds=15: ~3 sec/hash
 * rounds=25: ~1 hour/hash
 * rounds=31: 2-3 days/hash
 * ```
 *
 * Hash Info
 * The characters that comprise the resultant hash are:
 * ```js
 * ./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$.
 * ```
 * Resultant hashes will be 60 characters long.
 * @type  {Object}
 */
var Q = require("q"),
    bcrypt = require('bcrypt');

/**
 * Crypt Module Lib
 * Responsible for strictly encrypting, decrypting and comparing text(strings) with encrypted text.
 * @type  {Object}
 */
module.exports = {
    __saltRounds: 10,
    /**
     * @param   {String}  stringtext  [REQUIRED] - data to compare.
     * @param   {String}  encrypted   [REQUIRED] - data to be compared to.
     *
     * @return  {Boolean}             returning a resolving boolean once the data has been compared. uses eio making it asynchronous.
     */
    compare: function(stringtext, encrypted) {
        var deferred = Q.defer();

        /**
         * @param   {Object}   err   First parameter to the callback detailing any errors.
         * @param   {Boolean}  res   Second parameter to the callback providing whether the data and encrypted forms match [true | false].
         */
        bcrypt.compare(stringtext, encrypted, function(err, res) {
            if (err)
                deferred.reject(err);
            else
                deferred.resolve(res);
        });

        return deferred.promise;
    },
    /**
     * @param   {String}  data          [REQUIRED] - data to compare.
     * @param   {String}  encrypted     [REQUIRED] - data to be compared to.
     *
     * @return  {Boolean}               returning a resolving boolean once the data has been compared.
     */
    compareSync: function(data, encrypted) {
        return bcrypt.compareSync(data, encrypted);
    },
    /**
     * @param   {String}  encrypted  [REQUIRED] - hash from which the number of rounds used should be extracted.
     * @return  {Number}             return the number of rounds used to encrypt a given hash
     */
    getRounds: function(encrypted) {
        return bcrypt.getRounds(encrypted);
    },
    /**
     * @param   {String}  data  [REQUIRED] - the data to be encrypted.
     * @param   {Number}  salt  [REQUIRED] - the salt to be used to hash the password.
     *                          If specified as a number then a salt will be generated with the
     *                          specified number of rounds and used (see example under Usage).
     *
     * @return  {String}        returning a resolving an encrypted form once the data has been encrypted. uses eio making it asynchronous.
     */
    hash: function(data, salt) {
        var deferred = Q.defer();

        salt = salt || this.__saltRounds;

        bcrypt.hash(data, salt, function(err, hash) {
            if (err)
                deferred.reject(err);
            else
                deferred.resolve(hash);
        });

        return deferred.promise;
    },
    /**
     * @param   {String}        data    [REQUIRED] - the data to be encrypted.
     * @param   {Number=} [10]   salt    the salt to be used to hash the password.
     *                                  If specified as a number then a salt will be generated with the
     *                                  specified number of rounds and used (see example under Usage).
     *
     * @return  {String}                returning an encrypted form once the data has been encrypted.
     */
    hashSync: function(data, salt) {
        salt = salt || this.__saltRounds;
        return bcrypt.hashSync(data, salt);
    }
};