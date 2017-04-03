var express = require("express");
var warehouses = require("config/settings/warehouses");
var router = express.Router();
var searchFinishes = require('config/settings/searchFinishes.json');

/** Authenciated Routes */
router.use( "*", function( req, res, next ) {
	if( !req.user )
		return res.redirect( "/" );
	next();
});

router.get( "/:slug", function( req, res ) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var params = req.params;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var slug = params.slug;
	var brand_slug, title, caption;
	var dealer = user.dealer;

	switch( slug ) {
		case "caps":
			brand_slug = "caps";
			title = "Caps";
			caption = "Get caps with style and function for all makes and models.";
		break;
		case "hub-covers":
			brand_slug = "hub-covers";
			title = "Hub Covers";
			caption = "Shop the best chrome and stainless hub covers.";
		break;
		case "installation-kits-and-washers":
			brand_slug = ["installation-kits", "washers"];
			title = "Installation Kits And Washers";
			caption = "You found the right parts, install them in the right way.";
		break;
		case "lug-nuts-and-locks":
			brand_slug = ["lug-nuts", "locks"];
			title = "Lug Nuts And Locks";
			caption = "Feel secure with quality Vision Wheel lug nuts and locks.";
		break;
		case "rallye":
			brand_slug = "rallye";
			title = "Rallye";
			caption = "Your sport. Your look. Our parts. We’re proud to be part of the action.";
		break;
		case "rings":
			brand_slug = "rings";
			title = "Rings";
			caption = "Get the right fit with Vision Wheel hub centric rings.";
		break;
		case "valve-stems-and-spacers":
			brand_slug = ["spacers", "valve-stems"];
			title = "Valve Stems And Spacers";
			caption = "Choose from sizes and styles to fit the look of your vehicle.";
		break;
	}

	Promise.all([
		VWModel.getItemSpecifications({
			fields: ["model", "brand", "finish", "ply", "size"],
			privateLabel: dealer.nav_customer_id
		}),
		VWModel.findProducts({
			brand_slug: brand_slug
		})
	]).then(function( response ) {
		var filters = response[0];
		var products = {};
		// TEMP: do something better
		response[1].forEach(function( product, index, array ) {
			var brand = product.brand_slug.split( "-" ).join( " " ).toUpperCase();
			if( !products[brand] ) {
				products[brand] = [];
			}
			products[brand].push( product );
		});
		res.render( "accessories", {
			currentEnv: currentEnv,
			slug: slug,
			title: title,
			caption: caption,
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
						values: filters.tire.ply.map(str=>{return Number(str)}).sort((a,b)=>{return a-b})
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
			nav: nav,
			products: products,
			styles: ["/css/accessories.css"],
			scripts: ["/js/accessories.js"],
			user: user
		});
	}).catch(function( response ) {
		console.log( response );
	});
});

router.get( "/:slug/:product_slug", function( req, res ) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var params = req.params;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var product_slug = params.product_slug;
	VWModel.findProduct({
		slug: product_slug
	}).then(function( response ) {
		var product = response;
		res.render( "product", {
			currentEnv: currentEnv,
			nav: nav,
			product: product,
			scripts: ["/js/product.js"],
			styles: ["/css/product.css"],
			user: user,
			warehouses: warehouses
		});
	}).catch(function( response ) {
		console.log( response );
	});
});

router.get( "/:slug/:product_slug/:part_number", function( req, res ) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var params = req.params;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var product_slug = params.product_slug;
	var part_number = params.part_number;
	VWModel.findProduct({
		slug: product_slug
	}).then(function( response ) {
		var product = response;
		var items = (product.items && product.items.list && Array.isArray( product.items.list )) ? product.items.list : [];
		var fitments = product.type === "wheel" ? getWheelItemFitments( items ) : false;
		res.render( "product", {
			currentEnv: currentEnv,
			fitments: fitments,
			part_number: part_number,
			nav: nav,
			product: product,
			scripts: ["/js/product.js"],
			styles: ["/css/product.css"],
			user: user,
			warehouses: warehouses
		});
	}).catch(function( response ) {
		console.log( response );
	});
});

module.exports = {
	Router: router
};