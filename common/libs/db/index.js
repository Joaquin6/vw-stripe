var path = require("path"),
	Q = require("q"),
	_ = require("underscore"),
	Helprs = require("helprs"),
	Massive = require("massive"),
	colors = require('libs/colors'),
	debug = require("libs/buglog"),
	log = debug("libs", "db");

var Database;

var init = function(settings, callback) {
	var connectionOptions = {
		connectionString: buildConnection(settings),
		scripts: path.resolve(__dirname, "scripts"),
		enhancedFunctions: true, // Enable return type honoring
		defaults: settings.defaults
	};

	if (_.isObject(connectionOptions.connectionString) && connectionOptions.connectionString.statusCode === 500) {
		if (callback)
			callback(connectionOptions.connectionString);
		else {
			log("Connection String Error: %s", connectionOptions.connectionString.message);
			throw connectionOptions.connectionString;
		}
	}

	Massive.connect(connectionOptions, function(err, db) {
		if (err) {
			log(err);
			if (callback) {
				callback(err);
			} else {
				throw err;
			}
		} else {
			log("\t\tInitialized");
			Database = module.exports = db;
			if (callback) {
				callback(null, db);
			}
		}
	});
};

function buildConnection(settings) {
	/** Here we will add additionally functionality to handle multi DB Instances */
	var connectionString = "",
		isError = false;
	var err = {
		statusCode: 500,
		message: "DBConnection Error Message:"
	};

	if (!settings.client) {
		if (!isError) isError = true;
		err.message += " Missing DB Client";
	} else
		connectionString = settings.client;

	if (!settings.username) {
		if (!isError) {
			isError = true;
			err.message += " Missing DB Username";
		} else
			err.message += ", Missing DB Username";
	} else
		connectionString += "://" + settings.username;

	if (!settings.password) {
		if (!isError) {
			isError = true;
			err.message += " Missing DB Password";
		} else
			err.message += ", Missing DB Password";
	} else
		connectionString += ":" + settings.password;

	if (!settings.host) {
		if (!isError) {
			isError = true;
			err.message += " Missing DB Host";
		} else
			err.message += ", Missing DB Host";
	} else
		connectionString += "@" + settings.host;

	if (!settings.port) {
		if (!isError) {
			isError = true;
			err.message += " Missing DB Port";
		} else
			err.message += ", Missing DB Port";
	} else
		connectionString += ":" + settings.port;

	if (!settings.name) {
		if (!isError) {
			isError = true;
			err.message += " Missing DB Name";
		} else
			err.message += ", Missing DB Name";
	} else
		connectionString += "/" + settings.name;

	if (isError) {
		/** Clearly this will result in a DB Connection Error. This is a Potential Bug! */
		return Helprs.err(err.message, err);
	} else {
		return connectionString;
	}
}

module.exports = function(settings, callback) {
	if (Database) {
		return Database;
	} else {
		init(settings, callback);
	}
};