var _ = require("underscore"),
	express = require('express'),
	debug = require("libs/buglog"),
	log = debug("routes", "signup"),
	router = express.Router();

router.get("/", function(req, res) {
	var VWModel = req.VWModel;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	VWModel.findSalesreps().then(function(response) {
		res.render("signup", {
			currentEnv: currentEnv,
			salesreps: response
		});
	}).fail(function(err) {
		console.log(err);
		res.render("signup", {
			currentEnv: currentEnv,
			err: err,
			salesreps: []
		});
	}).done();
});

router.post("/", function(req, res) {
	var VWModel = req.VWModel;
	var formData = req.body;
	var settings = req.appSettings;
	var currentEnv = settings.environment;

	log("Submitting Signup Form Data: %O", formData);

	VWModel.dealerSignup(req.body).then(function(response) {
		res.render("signup", {
			currentEnv: currentEnv,
			success: true,
			user: response
		});
	}).fail(function(err) {
		log(err);
		VWModel.findSalesreps().then(function(response) {
			formData = _.extend(formData, {
				currentEnv: currentEnv,
				err: err,
				salesreps: response
			});
			res.render("signup", formData);
		}).fail(function(err) {
			formData = _.extend(formData, {
				currentEnv: currentEnv,
				err: err,
				salesreps: []
			});
			res.render("signup", formData);
		}).done();
	}).done();
});

module.exports = {
	Router: router
};