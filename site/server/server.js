var path = require('path'),
	os = require('os'),
	Q = require('q'),
	pg = require('pg'),
	express = require('express'),
	bodyParser = require('body-parser'),
	compression = require('compression'),
	methodOverride = require('method-override'),
	session = require('express-session'),
	pgSession = require('connect-pg-simple')(session),
	program = require('commander'),
	config = require('config'),
	colors = require('libs/colors'),
	logger = require("libs/logger"),
	debug = require('libs/buglog'),
	database = require('libs/db'),
	Stripe = require('libs/stripe'),
    AWS = require("libs/aws"),
	Mssql = require("libs/mssql"),
	Passport = require("libs/passport"),
	Cache = require("libs/helpers/cache"),
	Device = require("libs/helpers/device"),
	router = require('./router'),
	navSettings = require("./settings/nav.json"),
	tmpltsRootPath = path.resolve(__dirname, "views"),
	clientRootPath = path.resolve(__dirname, "..", "release"),
	app = express(),
	log = debug("server");


var settings = {}, VWModel;

readEnvironment();

database(settings.database, function(error, db) {
	/** @type {Object} The actual database instance is assigned. */
	database = db;
	/**
	 * The `VWModel` AFTER the DB has been instantiated, because the
	 * DB instance coming back from the Async connection is a dependency.
	 * @type  {Object}
	 */
	VWModel = require('models');
	setupEnvironment(function() {
		listen();
	});
});

function readEnvironment() {
	log('Reading Environment');
	var configEnv = config.settings('config/env');
	settings = config.mergeSettingsDefault(configEnv, program);
	settings.environment = app.get('env');

	global.settings = app.locals.settings = settings;

	Cache.set("TaxRatesAPI", settings.taxRatesAPI);
	Cache.set("Warehouses", settings.warehouses);

	if (settings.environment === "development") {
		Error.stackTraceLimit = settings.stackTraceLimit;
		log("Increased Stack Trace Limit to: %s", colors.blue(settings.stackTraceLimit));
	}
}

function setupEnvironment(callback) {
	log('Setting Up Environment');
	app.set('port', settings.port);
	/** Set View Engine */
	app.set("view engine", "pug");
	app.set("views", tmpltsRootPath);

	app.use(compression());
	app.use(bodyParser.urlencoded({
		extended: false
	}));
	app.use(bodyParser.json());
	app.use(methodOverride());
	app.use(Device.capture({
		parseUserAgent: true
	}));
	Device.enableDeviceHelpers(app);
	/**
	 * Load up the settings now, and make them available at all the routes.
	 * This way we dont load them multiple times in each route.
	 */
	app.use(function(req, res, next) {
		req.nav = navSettings;
		req.appSettings = settings;
		req.VWModel = VWModel;
		next();
	});
	app.use(express.static(clientRootPath));
	app.use(session({
		store: new pgSession({
			pg : pg,
    		conString : database.connectionString,
    		ttl: (60 * 60) * 8
		}),
		secret: 'your secret sauce',
		saveUninitialized: false,
		resave: true,
		cookie: {
			path: '/',
			httpOnly: true,
			secure: false,
			maxAge: null
		}
	}));

	initializeModules(function() {
		callback();
	});

	router.route(app);

	process.title = settings.app;
	process.on('uncaughtException', function(err) {
		log("Uncaught Exeption: %O", err);
		logger.error(err);
	});
	process.on("exit", function(code) {
		log("Closing with Code (%d)", code);
	});
}

function initializeModules(callback) {
	log('Initializing Modules');
	/** Initialize Passport */
	Passport.initialize(app, VWModel);
	/** Initialize MSSQL Connection */
	Mssql.initialize(settings, function() {
		callback();
	});
	/** Initialize Stripe */
	Stripe.initialize(settings);
    /** Initialize AWS */
    AWS.initialize(settings.aws);
}

function listen() {
	var appPort = app.get('port');
	app.listen(appPort, function() {
		log("\t-------- Node Configurations ---------");
		log('\tNode Environment: %s', colors.green(settings.environment));
		log("\tNode Started On Port: %d", appPort);
		log("\tNode Process ID (pid): %d", process.pid);
		log("\tNode Version: %s", process.version);
		log("\t--------- OS Configurations ---------");
		log("\tOS Type is %s and Platform is %s", os.type(), os.platform());
		log("\tOS Memory %s and Available Memory is %s", colors.green(os.totalmem()), colors.green(os.freemem()));
	});
}

module.exports = app;