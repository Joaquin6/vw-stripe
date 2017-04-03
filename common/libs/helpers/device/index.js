var path = require('path'),
    device = require('./lib/device');

function lookup(root, view, ext) {
	var name = resolveObjectName(view);
	var original = view;

	// Try root ex: <root>/user.jade
	view = resolve(root, basename(original, ext) + ext);
	if (exists(view)) return view;

	// Try subdir ex: <root>/subdir/user.jade
	view = resolve(root, dirname(original), basename(original, ext) + ext);
	if (exists(view)) return view;

	// Try _ prefix ex: ./views/_<name>.jade
	// taking precedence over the direct path
	view = resolve(root, '_' + name + ext)
	if (exists(view)) return view;

	// Try index ex: ./views/user/index.jade
	view = resolve(root, name, 'index' + ext);
	if (exists(view)) return view;

	// Try ../<name>/index ex: ../user/index.jade
	// when calling partial('user') within the same dir
	view = resolve(root, '..', name, 'index' + ext);
	if (exists(view)) return view;

	// Try root ex: <root>/user.jade
	view = resolve(root, name + ext);
	if (exists(view)) return view;

	return null;
};

function check(req, res, name) {
	var ext = path.extname(name) || '.' + (res.app.get('view engine') || 'html');
	var root = req.app.get('views') || process.cwd() + '/views';
	var dir = path.dirname(name) == '.' ? root : path.resolve(root, path.dirname(name));
	return lookup(dir, path.basename(name, ext), ext);
}

exports.namespace = 'express';

exports.Parser = device.Parser;

// should this be on 'device' instead?
function customCheck(req, mydevice) {
	var useragent = req.headers['user-agent'];

	if (!useragent || useragent === '') {
		if (req.headers['cloudfront-is-mobile-viewer'] === 'true') return 'phone';
		if (req.headers['cloudfront-is-tablet-viewer'] === 'true') return 'tablet';
		if (req.headers['cloudfront-is-desktop-viewer'] === 'true') return 'desktop';
		// No user agent.
		return mydevice.parser.options.emptyUserAgentDeviceType;
	}

	return mydevice.type;
};

exports.customCheck = customCheck;

function capture(options) {
	return function(req, res, next) {
		var useragent = req.headers['user-agent'];
		var mydevice = device(useragent, options);

		req.device = req.device || {};
		req.device.parser = mydevice.parser; // to expose the device parser object to the running app
		req.device.type = customCheck(req, mydevice);
		req.device.name = mydevice.model;

		if (next) return next();
	};
};

exports.capture = capture;

function enableViewRouting(app, options) {
	app.use(function(req, res, next) {
		var _render = res.render.bind(res);
		res.render = function(name, options, fn) {
			var layout = options && options.layout;
			var ignore = (options && options.ignoreViewRouting) || false;
			var deviceType = req.device.type;

			if (options && options.forceType) {
				deviceType = options.forceType;
			}

			if (ignore === false) {
				if (layout === true || layout === undefined) {
					var defaultLayout = path.join(deviceType, 'layout');
					options = options || {};
					if (check(req, res, defaultLayout)) options.layout = defaultLayout;
				} else if (typeof layout === "string") {
					var deviceLayout = path.join(deviceType, layout);
					if (check(req, res, deviceLayout)) options.layout = deviceLayout;
				}

				var deviceView = path.join(deviceType, name);
				if (check(req, res, deviceView)) name = deviceView;
			}

			_render(name, options, fn);
		};

		if (next) return next();
	});
};

exports.enableViewRouting = enableViewRouting;

function enableDeviceHelpers(app) {
	var check_request = function(req, res, next) {
		if (typeof req.device === 'undefined') {
			next(new Error('Must enable the device capture by using app.use(device.capture())'));
		} else {
			next();
		}
	};
	app.use(check_request);

	var check_device = function(device) {
		return function(req, res, next) {
			res.locals['is_' + device] = req.device.type === device;
			if (next) {
				next();
			}
		}
	}

	app.use(check_device('desktop'));
	app.use(check_device('phone'));
	app.use(check_device('tablet'));
	app.use(check_device('tv'));
	app.use(check_device('bot'));
	app.use(check_device('car'));

	var is_mobile = function(req, res, next) {
		res.locals.is_mobile = res.locals.is_phone || res.locals.is_tablet;
		if (next) {
			next();
		}
	};
	app.use(is_mobile);

	var device_type = function(req, res, next) {
		res.locals.device_type = req.device.type;
		if (next) {
			next();
		}
	};
	app.use(device_type);
	var device_name = function(req, res, next) {
		res.locals.device_name = req.device.name;
		if (next) {
			next();
		}
	};
	app.use(device_name);
};

exports.enableDeviceHelpers = enableDeviceHelpers;