var colors = require('libs/colors'),
	Cache = require('libs/helpers/cache');

module.exports = {
	time: function(uniqueName) {
		Cache.set("time-" + uniqueName, process.hrtime());
	},
	timeEnd: function(uniqueName, options) {
		options = options || {};

		if (!Cache.has("time-" + uniqueName))
			return 0;

		var hrstart = Cache.get("time-" + uniqueName);
		Cache.clear("time-" + uniqueName);
		var hrend = process.hrtime(hrstart);

		var msglog = colors.cyan(uniqueName) + " Execution Time: ";
		msglog += colors.yellow(hrend[0]) + "s ";
		msglog += colors.yellow(hrend[1]/1000000) + "ms";

		/** If `methodSuccess` is passed then append the following. */
		if (options.methodSuccess !== undefined) {
			if (options.methodSuccess)
				msglog += "\tStatus: " + colors.green("SUCCESSFUL");
			else
				msglog += "\tStatus: " + colors.red("FAILED");;
		}

		return msglog;
	}
};