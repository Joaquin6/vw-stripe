var _ = require("underscore"),
	bodyParser = require("body-parser"),
	express = require("express"),
	debug = require("libs/buglog"),
	log = debug("routes", "checkout"),
	router = express.Router();

/** Authenciated Routes */
router.use( "*", function( req, res, next ) {
	var user = req.user;
	if( !user ) {
		return res.redirect( "/" );
	}
	next();
});

router.get( "/", function( req, res ) {
	var VWModel = req.VWModel;
	var appSettings = req.appSettings;
	var nav = req.nav;
	var user = req.user;
	var currentEnv = appSettings.environment;
	var stripeSettings = appSettings.stripe;
	var stripeMode = stripeSettings.mode;
	var stripeKey = stripeSettings[stripeMode].keys.publishable_key;
	var userIsPending = !user.dealer ? true : false;

	var Checkout = VWModel.createCheckout({
		appSettings: appSettings,
		user: user
	});

	console.dir( Checkout );
	console.dir( Checkout.getErrors() );
	console.dir( Checkout.getProps() );

	Checkout.getCartDetailsAndSubtotal().then(function( response ) {
		var message = response.message;
		var parameters = response.parameters;
		var props = response.props;
		console.dir( message );
		console.dir( parameters );
		console.dir( props );
		res.render("checkout", {
			currentEnv: currentEnv,
			cart: {
				items: props.user.cart.items,
				subtotal: props.totals.subtotal
			},
			nav: nav,
			scripts: ["https://checkout.stripe.com/checkout.js", "/js/checkout.js"],
			stripeKey: stripeKey,
			styles: ["/css/checkout.css"],
			user: user,
			warehouses: props.warehouses
		});
	}).catch(function( error ) {
		var message = error.message;
		var parameters = error.parameters;
		var props = error.props;
		console.dir( message );
		console.dir( parameters );
		console.dir( props );
		res.render( "checkout", {
			currentEnv: currentEnv,
			cart: {
				items: [],
				subtotal: 0
			},
			nav: nav,
			scripts: ["https://checkout.stripe.com/checkout.js", "/js/checkout.js"],
			stripeKey: stripeKey,
			styles: ["/css/checkout.css"],
			user: user,
			warehouses: props.warehouses
		});
	});
});

router.post( "/totals", function( req, res ) {
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

	Checkout.getCartTotals({
		po_number: body.po_number,
		shipping: body.shipping,
		token: body.token,
		warehouses: body.warehouses
	}).then(function( response ) {
		var message = response.message;
		var parameters = response.parameters;
		var props = response.props;
		console.dir( message );
		console.dir( parameters );
		console.dir( props );
		res.status( 200 ).json({
			canPay: props.canPay,
			totals: props.totals
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

	Checkout.submitPurchaseOrder({
		po_number: body.po_number,
		shipping: body.shipping,
		token: body.token,
		warehouses: body.warehouses
	}).then(function( response ) {
		var message = response.message;
		var parameters = response.parameters;
		var props = response.props;
		console.dir( message );
		console.dir( parameters );
		console.dir( props );
		res.status( 200 ).json( response );
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

module.exports = {
	Router: router
};

function __submitPurchaseOrder(req, res, order, options) {
	var VWModel = req.VWModel;
	VWModel.submitPurchaseOrder( order, options ).then(function( response ) {
		res.status( 200 ).json( response );
	}).fail(function( error ) {
		res.status( 500 ).json( error );
	}).done();
}

function __getOptions(appSettings, props) {
	var currentEnv = appSettings.environment;
	var options = {
		canPay: props.canPay,
		environment: currentEnv,
		mockdata: false,
		po_number: props.po_number,
		shipping: props.shipping,
		token: props.token,
		totals: props.totals,
		user: props.user,
		warehouses: props.warehouses
	};
	return options;
}

function __getOrder(options) {
	var user = options.user;
	var dealer = user.dealer;
	var shipping = options.shipping;
	var totals = options.totals;

	var customer_info = {
		customer_name: shipping.first_name + " " + shipping.last_name,
		company_name: shipping.company,
		phone: user.phone_number,
		email: user.email
	};
	var payment = {
		paid: false,
		payable: options.canPay,
		payment_method: "CHARGE",
		CCInfo: "",
		CCStatus: "",
		CCAuthCode: "",
		CCAuthDate: "",
		CCSettleDate: "",
		CCResponse: ""
	};
	var billing_info = {
		address_1: shipping.address_1,
		address_2: shipping.address_2,
		city: shipping.city,
		state: shipping.state,
		zip: shipping.postalcode,
		country: shipping.country
	};
	var ship_to_info = {
		store_number: shipping.store_number
	};

	var order = {};
	order.po_number = options.po_number;
	order.user_id = user.id;
	order.dealer_id = dealer.id;
	order.salesrep_id = user.sales_rep;
	order.customer_id = dealer.nav_customer_id;
	order.tax_amount = totals.taxtotal;
	order.freight_total = totals.shippingtotal || 0.00;
	order.total_discount_amount = totals.total_discount_amount || 0.00;
	order.subtotal_amount = totals.subtotal;
	order.total_invoice_amount = totals.total;
	order.customer_info = customer_info;
	order.payment = payment;
	for (var key in billing_info) {
		ship_to_info[key] = billing_info[key];
	}
	order.ship_to_info = ship_to_info;
	for (var key in customer_info) {
		billing_info[key] = customer_info[key];
	}
	order.customer_billing_info = billing_info;

	console.dir(order.ship_to_info);
	console.dir(order.customer_billing_info);

	return order;
}

function __updateOrderByCharge(order, charge) {
	var payment = order.payment;

	/** Change the Payment Method to 'CREDIT' */
	payment.payment_method = "CREDIT CAR";

	/** Apply all necessary CC Details. */
	payment.CCStatus = 0;
	payment.CCAuthCode = charge.id;
	payment.CCAuthDate = charge.created;
	payment.CCSettleDate = "";

	/** Check if the Network Authorized the Transaction. */
	if (charge.outcome.type !== "authorized") {
		log("Stripe Charge Outcome NOT Authorized");
		log(charge.outcome);
		payment.CCStatus = 2;
	} else if (charge.outcome.type === "authorized") {
		payment.CCStatus = 1;
	}

	/** Set the flag that this has been paid */
	if (charge.paid) {
		payment.paid = charge.paid;
	}

	/** Now assign the CCInfo with the ccBrand and Last 4 */
	var ccBrand = charge.source.brand.toUpperCase();
	var ccLast4 = charge.source.last4;
	payment.CCInfo = "((" + ccBrand + ") xxxxx-xxxxx-" + ccLast4 + ")";

	log("Successfully Updated Order Payment with New Stripe Charge");
	log(payment);

	return order;
}