var EventEmitter = require('events');

function sqlEvtObj() {
    EventEmitter.call(this);
}

module.exports = sqlEvtObj;

sqlEvtObj.prototype = new EventEmitter();
sqlEvtObj.prototype.constructor = sqlEvtObj;
sqlEvtObj.prototype.open = function() {
    this.emit("open");
};