var express = require("express");
var warehouses = require("config/settings/warehouses.js");
var router = express.Router();
var searchFinishes = require('config/settings/searchFinishes.json');


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
			type: ["tire", "wheel"]
		}),
		VWModel.findProducts({
			type: ["tire", "wheel"]
		})
	]).then(function(response) {
		var filters = response[0];
		var popular = response[1];
		var products = response[2];
		var popularTires = [];
		var popularWheels = [];
		var tires = [];
		var wheels = [];
		popular.forEach(function( popularProduct, index, array ) {
			var type = popularProduct.type;
			switch (type) {
				case "tire":
					popularTires.push( popularProduct );
				break;
				case "wheel":
					popularWheels.push( popularProduct );
				break;
			}
		});
		products.forEach(function( product, index, array ) {
			var type = product.type;
			switch (type) {
				case "tire":
					tires.push( product );
				break;
				case "wheel":
					wheels.push( product );
				break;
			}
		});
		res.render("products", {
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
			styles: ["/css/products.css"],
			scripts: ["/js/products.js"],
			nav: nav,
			popular: {
				tires: popularTires,
				wheels: popularWheels
			},
			products: {
				tires: tires,
				wheels: wheels
			},
			user: user
		});
	}).catch(function(response) {
		console.log(response);
	});
});

// DEPRECATED - reverse item lookup route
// router.get( "/items/:item_id", function( req, res ) {
// 	var VWModel = req.VWModel;
// 	var nav = req.nav;
// 	var params = req.params;
// 	var user = req.user;
// 	var item_id = params.item_id;
// 	if( !isNaN( item_id ) ) {
// 		console.log( "IF" );
// 		item_id = parseInt( item_id );
// 		console.log( item_id );
// 		VWModel.searchProducts({
// 			term: item_id
// 		}, {
// 			columns: ["id", "items"]
// 		}).then(function( response ) {
// 			console.log( response );
// 			if( response.length ) {
// 				var brand_id = response[0].brand_id;
// 				var product_id = response[0].id;
// 				Promise.all([
// 					VWModel.findBrand({
// 						id: brand_id
// 					}),
// 					VWModel.findProduct({
// 						id: product_id
// 					})
// 				]).then(function( response ) {
// 					var brand = response[0];
// 					var product = response[1];
// 					var brand_slug = brand.slug;
// 					console.log( brand );
// 					console.log( product );
// 					res.redirect( `/products/${ brand_slug }/${ product_id }/${ item_id }` );
// 				}).catch(function( response ) {
// 					console.log( response );
// 				});
// 			}
// 			else {
// 				console.log( response );
// 				res.status( 500 ).send( "no results" );
// 			}
// 		}).catch(function( response ) {
// 			console.log( response );
// 			res.status( 500 ).send( "err" );
// 		});
// 	}
// 	else {
// 		console.log( item_id );
// 		res.status( 500 ).send( "err" );
// 	}
// });

router.get("/:brand_slug", function(req, res) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var params = req.params;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var brand_slug = params.brand_slug;
	Promise.all([
		VWModel.findBrand({
			slug: brand_slug
		}),
		VWModel.getPopularProducts({
			brand_slug: brand_slug
		}),
		VWModel.findProducts({
			brand_slug: brand_slug
		})
	]).then(function(response) {

		var brand = response[0];
		var popular = response[1];
		var products = response[2];
		res.render("brand", {
			currentEnv: currentEnv,
			brand: brand,
			nav: nav,
			popular: popular,
			products: products,
			scripts: ["/js/brand.js"],
			styles: ["/css/brand.css"],
			user: user
		});
	}).catch(function(response) {
		console.log(response);
	});
});

var getWheelItemFitments = function(items) {
	var boltpattern_split = {};
	var fitments = [];
	var string = "";
	// items.forEach(function( item, index, array ) {
	// 	var specification = item.specification;
	// 	var boltpattern_1 = specification.boltpattern1_inches;
	// 	var boltpattern_2 = specification.boltpattern2_inches;
	// 	var fitment_1 = boltpattern_1.split( "-" )[0];
	// 	var fitment_2 = boltpattern_2.split( "-" )[0];
	// 	if( (fitment_1 !== boltpattern_1) && !boltpattern_split[fitment_1] ) {
	// 		boltpattern_split[fitment_1] = "";
	// 	}
	// 	if( (fitment_2 !== specification.boltpattern2_inches) && !boltpattern_split[fitment_2] ) {
	// 		boltpattern_split[fitment_2] = "";
	// 	}
	// });
	// for( var key in boltpattern_split ) {
	// 	fitments.push( key );
	// }
	return fitments;
};

router.get("/:brand_slug/:product_slug", function(req, res) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var params = req.params;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var brand_slug = params.brand_slug;
	var product_slug = params.product_slug;

	var dealer = null;
	if (user.dealer)
		dealer = user.dealer;

	var productOpts = {
		slug: product_slug,
		privateLabel: false
	};

	if (dealer)
		productOpts.privateLabel = dealer.nav_customer_id;

	VWModel.findProduct(productOpts).then(function(response) {
		var product = response;
		var items = (product.items && product.items.list && Array.isArray(product.items.list)) ? product.items.list : [];
		var fitments = product.type === "wheel" ? getWheelItemFitments(items) : false;
		res.render("product", {
			currentEnv: currentEnv,
			fitments: fitments,
			nav: nav,
			product: product,
			scripts: ["/js/product.js"],
			styles: ["/css/product.css"],
			user: user,
			warehouses: warehouses
		});
	}).catch(function(response) {
		console.log(response);
	});
});

router.get("/:brand_slug/:product_slug/:part_number", function(req, res) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var params = req.params;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var product_slug = params.product_slug;
	var part_number = params.part_number;

	var dealer = null;
	if (user.dealer)
		dealer = user.dealer;

	var productOpts = {
		slug: product_slug,
		privateLabel: false
	};

	if (dealer)
		productOpts.privateLabel = dealer.nav_customer_id;

	VWModel.findProduct(productOpts).then(function(response) {
		var product = response;
		var items = (product.items && product.items.list && Array.isArray(product.items.list)) ? product.items.list : [];
		var fitments = product.type === "wheel" ? getWheelItemFitments(items) : false;
		res.render("product", {
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
	}).catch(function(response) {
		console.log(response);
	});
});

module.exports = {
	Router: router
};