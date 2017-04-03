/**
 * @fileOverview File review notes will go here.
 * @author Mirum Shoper Team <joaquin.briceno@mirumshoper.com>
 * @module Cache
 */

var _ = require("underscore"),
	Queue = require("../queue");

module.exports = {
	__cache : {},
	/**
	 * [get description]
	 * @param  {type} key [description]
	 * @return {type}     [description]
	 */
	get: function(key) {
		return this.__cache[key];
	},
	getQueue: function() {
		return _.allKeys(this.__cache);
	},
	/**
	 * [set description]
	 * @param  {[type]}  key      [description]
	 * @param  {[type]}  value    [description]
	 * @param  {[type]}  options  [description]
	 */
	set: function(key, value, options) {
		this.__cache[key] = value;

		// we can now set a timer on a cached object. For example,
		// if `options.maxMinutes = 5` then this cached object will be cleared
		// from the cache 5 minutes from the moment it was set.
		if (options && options.maxMinutes) {
			if (typeof options.maxMinutes !== 'number')
				options.maxMinutes = parseInt(options.maxMinutes);
			if (isNaN(options.maxMinutes))
				return;
			Queue.add(this.clear, this, key, options.maxMinutes);
		}
	},
	/**
	 * [has description]
	 * @param  {type}  key [description]
	 * @return {Boolean}     [description]
	 */
	has: function(key) {
		return this.__cache[key] != undefined;
	},
	/**
	 * [clear description]
	 * @param  {type} key [description]
	 * @return {type}     [description]
	 */
	clear: function(key) {
		if (key == undefined) {
			this.__cache = {};
		} else {
			delete this.__cache[key];
		}
	}
};