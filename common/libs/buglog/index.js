var debug = require('debug');

var appName = "vwd";

/** set all output to go via console.info overrides all per-namespace log settings */
debug.log = console.info.bind(console);

module.exports = function(groupName, refName, envName) {
	return debug(getDebugName(groupName, refName, envName));
};

function getDebugName(groupName, refName, envName) {
	var debugName = appName;
	if (envName)
		debugName += ":" + envName;
	if (groupName)
		debugName += ":" + groupName;
	if (refName)
		debugName += ":" + refName;
	return debugName;
}