var express     = require('express');
var router      = express.Router();

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
	res.render("downloads", {
		currentEnv: currentEnv,
		nav: nav,
		styles: ["/css/home.css"],
		scripts: ["/js/home.js"],
		user: user
	});
});

module.exports = {
	Router: router
};