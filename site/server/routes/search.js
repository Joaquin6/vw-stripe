var _ = require("underscore"),
	colors = require('colors'),
	express = require("express"),
	debug = require("libs/buglog"),
	log = debug("routes", "search"),
	router = express.Router(),
	searchFinishes = require('config/settings/searchFinishes.json');

/** Authenciated Routes */
router.use("*", function(req, res, next) {
	if (!req.user)
		return res.redirect("/");
	next();
});

router.get("/", function(req, res) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var query = req.query;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var keys = [];

	for (var key in query) {
		keys.push(key);
	}

	var dealer = null;
	if (user.dealer)
		dealer = user.dealer;

	var itemSpecOpts = {
		fields: [
			"backspace",
			"boltpattern1",
			"boltpattern2",
			"diameter",
			"finish",
			"model",
			"offset",
			"part_number",
			"ply",
			"search_description",
			"size",
			"width"
		],
		privateLabel: false
	};

	if (dealer)
		itemSpecOpts.privateLabel = dealer.nav_customer_id;

	if (!keys.length) {
		VWModel.getItemSpecifications(itemSpecOpts).then(function(response) {
			var filters = response;
			res.render("search", {
				currentEnv: currentEnv,
				filters: {
					accessory: {
						// part_number: {
						// 	label: "Item No.",
						// 	values: filters.accessory.part_number
						// },
						finish: {
							label: "Finish",
							values: filters.accessory.finish.sort()
						},
						size: {
							label: "Size",
							values: filters.accessory.size.sort()
						},
						model: {
							label: "Type",
							values: filters.accessory.model.sort()
						}
					},
					tire: {
						// part_number: {
						// 	label: "Item No.",
						// 	values: filters.tire.part_number.sort()
						// },
						search_description: {
							label: "Search Size",
							values: filters.tire.search_description.sort()
						},
						model: {
							label: "Pattern",
							values: filters.tire.model.sort()
						},
						ply: {
							label: "Ply",
							values: filters.tire.ply.map(str => {
								return Number(str)
							}).sort((a, b) => {
								return a - b
							})
						}
					},
					wheel: {
						// part_number: {
						// 	label: "Item No.",
						// 	values: filters.wheel.part_number.sort()
						// },
						offset: {
							label: "Offset",
							values: filters.wheel.offset.map(str => {
								return Number(str)
							}).sort((a, b) => {
								return a - b
							})
						},
						finish: {
							label: "Finish",
							values: Object.keys(searchFinishes).sort() //filters.wheel.finish.sort()
						},
						diameter: {
							label: "Diameter",
							values: filters.wheel.diameter.sort()
						},
						width: {
							label: "Width",
							values: filters.wheel.width.map(str => {
								return Number(str)
							}).sort((a, b) => {
								return a - b
							})
						},
						boltpattern1: {
							label: "Bolt Pattern 1",
							values: filters.wheel.boltpattern1.sort()
						},
						boltpattern2: {
							label: "Bolt Pattern 2",
							values: filters.wheel.boltpattern2.sort()
						},
						backspace: {
							label: "Backspace",
							values: filters.wheel.backspace.map(str => {
								return Number(str)
							}).sort((a, b) => {
								return a - b
							})
						}
					}
				},
				nav: nav,
				scripts: ["/js/search.js"],
				styles: ["/css/search.css"],
				user: user
			});
		}).fail(function(err) {
			log(err);
		}).done();
	} else if (keys.length === 1 && query.part_number) {
		/** If we hit here, this means user searched by part number */
		var params = {term: "%" + query.part_number + "%"};
		var opts = {columns: ["part_number"], dealer: null};
		if (dealer)
			opts.dealer = dealer;

		Promise.all([
			VWModel.searchItems(params, opts),
			VWModel.searchNAVXRefs(params, opts)
		]).then(function(results) {
			var postgresResults = results[0];
			var navXRefsResults = results[1];
			log("Search By Part Number");
			log("Results from Postgres: %o", postgresResults);
			log("Results from NAV: %o", navXRefsResults);

			var items = _.union(postgresResults, navXRefsResults);
			res.render("search", {
				currentEnv: currentEnv,
				nav: nav,
				results: items,
				scripts: ["/js/search.js"],
				styles: ["/css/search.css"],
				user: user
			});
		}).catch(function(err) {
			log(err);
		});
	} else {
		if (dealer)
			query.privateLabel = dealer.nav_customer_id;

		if (query.finish) {
			// if user is searching for a finish, compare the finish to the 'searchFinishes' then insert the list of finishes instead of the broad one
			query.finish = Object.keys(searchFinishes).includes(query.finish) ? searchFinishes[query.finish] : query.finish;
		}
		log("Search Query: %O", query);
		VWModel.filterItems(query).then(function(response) {
			log(response);
			var items = response;
			if (items.length === 1) {
				var item = items[0];
				res.redirect(`/products/${ item.specification.brand_slug }/${ item.specification.product_slug }/${ item.part_number }`);
			} else {
				res.render("search", {
					currentEnv: currentEnv,
					nav: nav,
					results: items,
					scripts: ["/js/search.js"],
					styles: ["/css/search.css"],
					user: user
				});
			}
		}).fail(function(err) {
			log(err);
		}).done();
	}
});

module.exports = {
	Router: router
};