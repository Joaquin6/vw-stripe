/** Configuring the master routes for the site. */
var accessories = require("./routes/accessories"),
	account = require("./routes/account"),
	auth = require("./routes/auth"),
	cart = require("./routes/cart"),
	checkout = require("./routes/checkout"),
	contact = require("./routes/contact"),
	creditApplication = require("./routes/credit"),
	downloads = require("./routes/downloads"),
	inventory = require("./routes/inventory"),
	locations = require("./routes/locations"),
	products = require("./routes/products"),
	rma = require("./routes/rma"),
	search = require("./routes/search"),
	signup = require("./routes/signup"),
	tires = require("./routes/tires"),
	wheels = require("./routes/wheels"),
	debugRte = require("./routes/debug"),
	/** Common Libs */
	colors = require("libs/colors"),
	debug = require("libs/buglog"),
	log = debug("routes");

module.exports = {
	route: function(app) {
		/** Request Logger Middleware */
		app.use("*", function(req, res, next) {
			log("\t%O", __deviceDetectionLog(req));
			next();
		});

		app.use("/", auth.Router);
		app.use("/accessories", accessories.Router);
		app.use("/account", account.Router);
		app.use("/cart", cart.Router);
		app.use("/checkout", checkout.Router);
		app.use("/contact", contact.Router);
		app.use("/credit-application", creditApplication.Router);
		app.use("/downloads", downloads.Router);
		app.use("/inventory", inventory.Router);
		app.use("/locations", locations.Router);
		app.use("/products", products.Router);
		app.use("/rma", rma.Router);
		app.use("/search", search.Router);
		app.use("/signup", signup.Router);
		app.use("/tires", tires.Router);
		app.use("/wheels", wheels.Router);

		/** For Debugging */
		app.use("/debug", debugRte.Router);
	}
};

function __deviceDetectionLog(req) {
	var device = req.device;
	var useragent = device.parser.useragent;

	var dispatch = req.protocol + "://";
	dispatch += " " + req.method + " " + req.get("host") + " " + req.originalUrl;

	var agent = useragent.family;
	agent += " v" + useragent.major + "." + useragent.minor + "." + useragent.patch;

	return {
		Dispatch: dispatch,
		Device: __capitalize(device.type),
		Useragent: agent,
		User_Session: Boolean(req.user)
	};
}

function __capitalize(str) {
	return str.replace(/\w\S*/g, function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}