var Controller = require("./controller"),
	Model = require("./model");

module.exports = function(parameters) {
	return new Controller(new Model(parameters));
};
