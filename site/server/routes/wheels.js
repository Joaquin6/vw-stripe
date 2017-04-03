var express = require("express"),
    debug = require("libs/buglog"),
    log = debug("routes", "wheels"),
    searchFinishes = require('config/settings/searchFinishes.json'),
    router = express.Router();

/** Authenciated Routes */
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

    var dealer = null;
    if (user.dealer)
        dealer = user.dealer;

    var itemSpecOpts = {
        fields: ["model", "brand", "finish", "ply", "size"],
        privateLabel: false
    };

    if (dealer)
        itemSpecOpts.privateLabel = dealer.nav_customer_id;

	Promise.all([
		VWModel.getItemSpecifications(itemSpecOpts),
		VWModel.getPopularProducts({
			type: "wheel"
		}),
		VWModel.findProducts({
			type: "wheel"
		}),
	]).then(function(response) {
		var filters = response[0];
		var products = response[1];
		res.render("wheels", {
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
						values: filters.tire.ply.map(str => {
							return Number(str)
						}).sort((a, b) => {
							return a - b
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
						values: Object.keys(searchFinishes).sort() //filters.wheel.finish.sort()
					},
					size: {
						label: "Size",
						values: filters.wheel.size.sort()
					}
				}
			},
			products: products,
			scripts: ["/js/wheels.js"],
			styles: ["/css/wheels.css"],
			nav: nav,
			user: user
		});
	}).catch(function(response) {
		log(response);
	});
});

module.exports = {
	Router: router
};