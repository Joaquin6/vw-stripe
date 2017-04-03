var fs = require("fs"),
	path = require("path"),
	Q = require("q"),
	colors = require("colors"),
	imagemin = require("imagemin"),
	imageminGifsicle = require("imagemin-gifsicle"),
	imageminJpegtran = require("imagemin-jpegtran"),
	imageminPngquant = require("imagemin-pngquant"),
	imageminSvgo = require("imagemin-svgo");

module.exports = {
	Buffer: function(buffer) {
		var deferred = Q.defer();

		imagemin.buffer(buffer, {
			cache: false,
			plugins: [
				imageminGifsicle({}),
				imageminJpegtran({}),
				imageminPngquant({}),
				imageminSvgo({})
			]
		}).then(function(result) {
			deferred.resolve({
				buffer: result
			});
		});

		return deferred.promise;
	}
};