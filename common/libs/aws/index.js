/**
 * @fileOverview Constructs a service interface object. Each API operation is exposed as a function on service.
 * @author Mirum Shoper Team <joaquin.briceno@mirumshoper.com>
 * @module Cache
 * @type {Object}
 */
var fs = require("fs"),
	path = require("path"),
	Q = require("q"),
	_ = require("underscore"),
	AWS = require("aws-sdk"),
	fsMkdirp = require("fs-mkdirp"),
	Imagemin = require("libs/imagemin"),
	debug = require("libs/buglog"),
	log = debug("libs", "aws");

var isProduction, s3Bucket, s3, ses, settings;

module.exports = {
	initialize: function(parameters) {
		settings = parameters || {};

		if (settings.config.accessKeyId)
			process.env.AWS_ACCESS_KEY_ID = settings.config.accessKeyId;
		if (settings.config.secretAccessKey)
			process.env.AWS_SECRET_ACCESS_KEY = settings.config.secretAccessKey;

		isProduction = process.env.NODE_ENV === "production";
		s3Bucket = isProduction ? "" : "http://localhost:8080/images/s3";

		AWS.config = new AWS.Config(settings.config);
		// AWS.config.loadFromPath(path.resolve('../common/libs/aws/config.json'));
		s3 = new AWS.S3();
		ses = new AWS.SES({
			apiVersion: '2010-12-01'
		});

		log("\t\tInitialized");
	},
	upload: function() {
		var s3Upload;
		if (isProduction) {
			s3Upload = function(params, callback) {
				params.Bucket = s3Bucket;
				s3.upload(params, callback);
			};
		} else {
			s3Upload = function(params, callback) {
				var key = params.Key;
				var splitKey = params.Key.split("/");
				var pathname = "./release/images/s3/${ key }";
				var buffer = params.Body;
				var directory;
				splitKey.pop();
				directory = splitKey.join("/");
				fsMkdirp("./release/images/s3/${ directory }", function(error, log) {
					fs.writeFile(pathname, buffer, function(error) {
						var result = {
							Location: "${ s3Bucket }/${ key }"
						};
						callback(error, result);
					});
				});
			};
		}
		return s3Upload;
	},
	writeFile: function(pathname, data) {
		var deferred = Q.defer();
		fs.writeFile(pathname, data, deferred.makeNodeResolver());
		return deferred.promise;
	},
	sendEmail: function(email, subject, body, cc, bcc) {
		var deferred = Q.defer();

		body += "\r\n";

		var to = [email];
		/** this must relate to a verified SES account */
		var from = settings.ses.source;

		var params = {
			Source: from,
			Destination: {
				ToAddresses: to
			},
			Message: {
				Subject: {
					Data: subject
				},
				Body: {
					Html: {
						Data: body,
					},
					Text: {
						Data: body,
					}
				}
			}
		};

		if (cc)
			params.Destination.CcAddresses = cc;
		if (bcc)
			params.Destination.BccAddresses = bcc;


		/** @todo - add HTML version */
		ses.sendEmail(params, function(err, data) {
			if (err)
				deferred.reject(err);
			else
				deferred.resolve(data);
		});
		return deferred.promise;
	}
};