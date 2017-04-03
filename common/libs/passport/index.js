var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	Crypt = require('libs/crypt'),
	colors = require('libs/colors'),
	logger = require("libs/logger"),
	debug = require('libs/buglog'),
	Exectimer = require("libs/helpers/exectimer"),
	log = debug("libs", "passport");

var VWModel = null;

module.exports = {
	initialize: function(app, vwmodel) {
		/** Initialize Passport */
		app.use(passport.initialize());
		app.use(passport.session());

		VWModel = vwmodel;

		configureLocalStrategy();

		log("\tInitialized");
	},
	validateLogin: function(req, res, next, callback) {
		Exectimer.time("validateLogin");
		passport.authenticate('local', function(err, user, info) {
			if (err) {
				log(err);
				log(Exectimer.timeEnd("validateLogin"));
				return callback(err);
			}

			if (user) {
				log("User Logged In with: %o", req.body);
				req.logIn(user, function(err) {
					if (err) {
						log(err);
						log(Exectimer.timeEnd("validateLogin"));
						return callback(err);
					}
					req.session.save(function() {
						log(Exectimer.timeEnd("validateLogin"));
						callback(null, "/");
					});
				});
			} else {
				log(Exectimer.timeEnd("validateLogin"));
				callback(null, "/?error=incorrect");
			}
		})(req, res, next);
	}
};

function configureLocalStrategy() {
	/**
	 * passport session setup
	 * required for persistent login sessions
	 * passport needs ability to serialize and unserialize users out of session
	 */
	passport.use(new LocalStrategy({
		/** by default, local strategy uses username and password, we will override with email */
		usernameField: "email",
		passwordField: 'password',
		/** allows us to pass back the entire request to the callback */
		passReqToCallback: true
	}, function(req, email, password, done) {
		Exectimer.time("authenticate");
		log("passport.authenticate: %s", email);
		/** First we confirm if the user exists */
		VWModel.findUser({email: email}).then(function(user) {
			/** User was found with the supplied email. Now we grab the User's Login Record. */
			VWModel.findLogin({id: user.login_id}).then(function(login) {
				/** if the user is found but the password is wrong */
				if (!Crypt.compareSync(password, login.password_hash)) {
					log(Exectimer.timeEnd("authenticate"));
					return done(null, false, {
						message: 'Invalid Login: Incorrect Password'
					});
				}
				/**
				 * Successful Authentication, OK to login.
				 * But before we do so, we have to update the login record's "last_accessed"
				 * column to keep track of the last time (now) the user logged in. By default,
				 * the `VWModel.updateLogin` method will add `last_accessed = new Date()`
				 * if not passed.
				 */
				VWModel.updateLogin(login).then(function(response) {
					log("Successfully Updated User's Login Record.");
				}).fail(function(err) {
					log("Error Updating User's Login Record: %O", err);
				}).done();

				log(Exectimer.timeEnd("authenticate"));
				return done(null, user);
			}).fail(function(err) {
				log("Unable to find User's Login Record: %O", err);
				log(Exectimer.timeEnd("authenticate"));
				return done(null, false, {
					message: "Please Try Again Later"
				});
			}).done();
		}).fail(function(err) {
			/** Check and confirm the `err` and `user_result` callback parameters */
			if (err.errorCode && err.errorCode === 1000) {
				/**
				 * if no user is found, return the `Invalid Login` message.
				 * This is data related.
				 * Meaning Solid connection with Query and DB, but no user
				 * found with the provided `email` address.
				 */
				log(Exectimer.timeEnd("authenticate"));
				return done(null, false, {
					message: 'Invalid User: Email Does not Exist'
				});
			} else {
				/**
				 * If there was a DB ERROR return err. There was a problem.
				 * This is the user of a Query or DB issue.
				 * NOT data related.
				 */
				log(Exectimer.timeEnd("authenticate"));
				return done(err);
			}
		}).done();
	}));

	/** used to serialize the user for the session */
	passport.serializeUser(function(user, done) {
		log("passport.serializeUser: (%s)", colors.green(user.id));
		done(null, user.id);
	});

	/** used to deserialize the user */
	passport.deserializeUser(function(id, done) {
		log("passport.deserializeUser: (%s)", colors.green(id));
		VWModel.getUserDealerById(id).then(function(user) {
			done(null, user);
		}).fail(function(err) {
			log("Unable to Deserialize User: %O", err);
			logger.error(err);
		}).done();
	});
}