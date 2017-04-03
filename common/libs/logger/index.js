var fs = require('fs');
var util = require('util');
var stamp = require('./stamp');

var logPath = "logs";
var defaultWriteStreamOpts = {
	flags: 'w',
	defaultEncoding: 'utf8',
	fd: null,
	mode: 0o666,
	autoClose: true
};

var out = getStreamOut();
var err = getStreamErr();

var logger = new console.Console(out, err);

stamp(logger, {
	stdout: out,
	stderr: err
});

module.exports = logger;

function getStreamOut() {
	mkdirPath();
	return fs.createWriteStream('logs/vwd-stdout.log');
}

function getStreamErr() {
	mkdirPath();
	return fs.createWriteStream('logs/vwd-stderr.log');
}

function mkdirPath() {
	if (!fs.existsSync(logPath)) {
		fs.mkdirSync(logPath);
	}
}