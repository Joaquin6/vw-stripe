var path = require('path'),
	express = require('express'),
	Passport = require('libs/passport'),
	debug = require("libs/buglog"),
	log = debug("routes", "auth"),
	searchFinishes = require('config/settings/searchFinishes.json'),
	router = express.Router();

/** Authenciated Routes */
router.get("/", function(req, res) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;

	log("Home page hit. User Session:", Boolean(user));

	if (user) {
		var dealer = user.dealer;
		var privateLabel = dealer && dealer.nav_customer_id ? dealer.nav_customer_id : false;

		VWModel.getItemSpecifications({
			fields: ["model", "brand", "finish", "ply", "size"],
			privateLabel: privateLabel
		}).then(function(response) {
			var filters = response;
			res.render("home", {
				currentEnv: currentEnv,
				filters: {
					accessory: {
						model: {
							label: "Type",
							values: filters.accessory.model.sort()
						},
						finish: {
							label: "Finish",
							values: filters.accessory.finish.sort()
						},
						size: {
							label: "Size",
							values: filters.accessory.size.sort()
						}
					},
					tire: {
						brand: {
							label: "Brand",
							values: filters.tire.brand.sort()
						},
						ply: {
							label: "Ply",
							values: filters.tire.ply.map(function(str) {
								return Number(str);
							}).sort(function(a, b) {
								return a - b;
							})
						},
						size: {
							label: "Size",
							values: filters.tire.size.sort()
						}
					},
					wheel: {
						brand: {
							label: "Brand",
							values: filters.wheel.brand.sort()
						},
						finish: {
							label: "Finish",
							values: Object.keys(searchFinishes).sort() //filters.wheel.finish
						},
						size: {
							label: "Size",
							values: filters.wheel.size.sort()
						}
					}
				},
				nav: nav,
				scripts: ["/js/home.js"],
				styles: ["/css/home.css"],
				user: user
			});
		}).fail(function(err) {
			log(err);
		}).done();
	} else {
		res.render("login", {
			currentEnv: currentEnv,
			styles: ["/css/login.css"],
			scripts: ["/js/login.js"],
			error: req.query.error ? req.query.error : false
		});
	}
});


/** Unauthenciated Routes */
router.post("/login", function(req, res, next) {
	Passport.validateLogin(req, res, next, function(err, redirect) {
		if (err)
			return next(err);
		res.redirect(redirect);
	});
});

router.get("/logout", function(req, res) {
	req.session.destroy(function(err) {
		res.clearCookie();
		res.redirect('/');
	});
});

router.get("/forgot-password", function(req, res) {
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	res.render("forgotpassword", {
		currentEnv: currentEnv
	});
});

router.post("/forgot-password", function(req, res) {
	var body = req.body;
	var VWModel = req.VWModel;
	var absResetUrl = req.protocol + '://' + req.get('host') + "/reset-password";
	var settings = req.appSettings;
	var currentEnv = settings.environment;

	VWModel.sendPasswordResetEmail(body.email, absResetUrl).then(function(response) {
		log(response);
		res.render("forgotpassword", {
			currentEnv: currentEnv,
			ResponseMetadata: {
				RequestId: "bf222c98-dce8-11e6-ad2a-2364c18955d7"
			},
			MessageId: "01000159add75679-159bd5a3-7d6b-4a89-a904-9bfdf1b17b68-000000",
			success: response.success
		});
	}).fail(function(err) {
		res.render("forgotpassword", {
			currentEnv: currentEnv,
			error: "not found"
		});
	}).done();
});

// TODO: v what is this?
// router.get("/reset-password/:token", function(req, res) {
// 	res.render("resetpassword", {
// 		action: req.params.token
// 	});
// });

// router.post("/reset-password/:token", function(req, res) {
// 	var body = req.body;
// 	var params = req.params;
// 	var VWModel = req.VWModel;

// 	if (body.password !== body.confirm) {
// 		res.render("resetpassword", {
// 			error: "Password's do not match",
// 			action: req.params.token
// 		});
// 	} else {
// 		VWModel.resetPasswordByLogin(params.token, body.password).then(function(response) {
// 			res.render("resetpassword", {
// 				success: true,
// 				action: req.params.token
// 			});
// 		}).fail(function(err) {
// 			log(err);
// 			res.render("resetpassword", {
// 				error: "Error Reseting Password",
// 				action: req.params.token
// 			});
// 		}).done();
// 	}
// });

module.exports = {
	Router: router
};