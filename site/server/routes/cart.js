var bodyParser = require("body-parser"),
	express = require("express"),
	debug = require("libs/buglog"),
	log = debug("routes", "cart"),
	router = express.Router();

/** Authenticated Routes */
router.use("*", function(req, res, next) {
	if (!req.user)
		return res.redirect("/");
	next();
});

router.get("/", function(req, res) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var cart = user.cart;
	res.render("cart", {
		currentEnv: currentEnv,
		cart: cart,
		nav: nav,
		scripts: ["/js/home.js"],
		styles: ["/css/home.css"],
		user: user
	});
});

router.post("/", function(req, res) {
	var VWModel = req.VWModel;
	var appSettings = req.appSettings;
	var body = req.body;
	var user = req.user;

	var Checkout = VWModel.createCheckout({
		appSettings: appSettings,
		user: user
	});

	console.dir( Checkout );
	console.dir( Checkout.getErrors() );
	console.dir( Checkout.getProps() );

	Checkout.addToCart({
		id: body.id,
		locations: body.locations
	}).then(function( response ) {
		var message = response.message;
		var parameters = response.parameters;
		var props = response.props;
		var item;
		console.dir( message );
		console.dir( parameters );
		console.dir( props );
		for( var index = 0; index < props.user.cart.items.length; index++ ) {
			if( props.user.cart.items[index].id === parameters.id ) {
				item = props.user.cart.items[index];
				break;
			}
		}
		res.status( 200 ).json({
			error: null,
			data: {
				details: item,
				locations: parameters.locations
			}
		});
	}).catch(function( error ) {
		var message = error.message;
		var parameters = error.parameters;
		var props = error.props;
		console.dir( message );
		console.dir( parameters );
		console.dir( props );
		res.status( 500 ).json( error );
	});
});

router.post("/:id", function(req, res) {
	var VWModel = req.VWModel;
	var appSettings = req.appSettings;
	var body = req.body;
	var params = req.params;
	var query = req.query;
	var user = req.user;

	if (query && query.remove) {
		log("Removing Item (ID: %s - Location: %s) from Cart!", params.id, body.location);

		var Checkout = VWModel.createCheckout({
			appSettings: appSettings,
			user: user
		});

		console.dir( Checkout );
		console.dir( Checkout.getErrors() );
		console.dir( Checkout.getProps() );

		Checkout.removeFromCart({
			id: params.id,
			location: body.location
		}).then(function( response ) {
			var message = response.message;
			var parameters = response.parameters;
			var props = response.props;
			console.dir( message );
			console.dir( parameters );
			console.dir( props );
			res.status( 200 ).json({
				cart: props.user.cart,
				subtotal: props.totals.subtotal,
				warehouses: props.warehouses
			});
		}).catch(function( error ) {
			var message = error.message;
			var parameters = error.parameters;
			var props = error.props;
			console.dir( message );
			console.dir( parameters );
			console.dir( props );
			res.status( 500 ).json( error );
		});
	}
	else {
		// do nothing
		res.status(200).json({
			message: "ok"
		});
	}
});

module.exports = {
	Router: router
};