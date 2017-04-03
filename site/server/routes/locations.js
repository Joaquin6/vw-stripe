var express     = require('express');
var router      = express.Router();
var warehouses = require('config/settings/warehouses');

/** Authenciated Routes */
router.use( "*", function(req, res, next) {
    if (!req.user)
    	return res.redirect( "/" );
    next();
});

router.get( "/", function(req, res) {
	var nav = req.nav;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	res.render("locations", {
		currentEnv: currentEnv,
		nav: nav,
		user: user,
		warehouses: warehouses
	});
});

module.exports = {
	Router: router
};