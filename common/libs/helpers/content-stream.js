// Require our core node modules.
var fs = require('fs');
var os = require('os');
var Q = require('q');
var Buffer = require('buffer').Buffer;
var stream = require('stream');
var util = require('util');

// I am a writable stream that accumulates content across writes and emits a "content"
// event once the entirety of the content has been aggregated. The content is emitted
// as a UTF-8 encoded value (for now).
function ContentStream(options) {

	options = options || {};

	// Whether or not the stream.write(anyObj) is a valid operation.
	// If set you can write arbitrary data instead of only Buffer / String data.
	options.objectMode = (options.objectMode || false);

	// Call the super constructor.
	stream.Writable.call(this, options);

	// I am the max length that the aggregated content size can be. If the max size is
	// exceeded, an error is emitted.
	this.maxContentLength = (options.newMaxContentLength || os.freemem());
	this.chunks = [];
	this.writable = true;
	this.limit = (options.limit || Infinity);
	this.size = 0;

	// I hold the running sum of buffer lengths being aggregated internally. I am used
	// to validate the max content length.
	this._contentLength = 0;

	// I hold the individual chunks across writes so that we don't have to concat all
	// the chunk values until the stream is finished.
	this._buffers = [];

	// I am the deferred value representation of the stream state.
	// --
	// NOTE: The stream and the deferred value are only linked because we say they are
	// linked. As such, it's up to us to determine the interplay between stream events
	// and the deferred value.
	this._deferred = Q.defer();

	// Expose the promise on the stream.
	var promise = this.promise = this._deferred.promise;

	// Expose the promise methods on the stream itself (as a convenience). Since the
	// Promise is implemented using prototypal inheritance (as opposed to relying on
	// lexical binding), we have to bind the method references back to the promise.
	// --
	// NOTE: This makes the stream a "thenable" object.
	this.then = promise.then.bind(promise);
	this.catch = promise.catch.bind(promise);
	this.finally = promise.finally.bind(promise);

	// When the stream is closed, and the finish event is emitted; at that point, we can
	// flatten all of the aggregated buffers.
	this.once('finish', this._handleFinishEvent);

	// When the content event is emitted, we can use that resolve the deferred value.
	// --
	// NOTE: We are using .once() since we can only resolve the value once.
	this.once('content', this._deferred.resolve);

	// If anything goes wrong, the stream will emit an error, which we can use to reject
	// the deferred value.
	// --
	// CAUTION: Since we are binding to the error event, it will be sufficient to stop
	// the error event from bubbling up as an exception. However, any existing "pipe"
	// will be automatically unpiped due to the default stream behavior. That said, we
	// are using .on() (instead of .once()) so that we will catch more than one error
	// event. Just because we reject the deferred value, it doesn't mean that we want to
	// start letting subsequent error events go unhandled.
	this.on('error', this._deferred.reject);
}

util.inherits(ContentStream, stream.Writable);

// ---
// PRIVATE METHODS.
// ---

// I handle the finish event emitted on the stream, which is emitted once the write
// stream has been closed.
ContentStream.prototype._handleFinishEvent = function() {
	// Collapse all the buffers into a single string value.
	var content = Buffer.concat(this._buffers, this.size).toString('utf-8');

	this.emit('content', content);
};

// I consume the chunk of data being written to the stream.
ContentStream.prototype._write = function(chunk, encoding, chunkConsumed) {
	// The stream and the underlying deferred value are not inherently linked. As such,
	// there's nothing that will stop the stream from accepting writes just because the
	// deferred value has been resolved or rejected. As such, we have to reject any write
	// that is executed after the deferred value is no longer in a pending state.
	if (!this.promise.isPending()) {

		return (chunkConsumed(new Error('Stream is no longer pending.')));

	}

	chunk = JSON.stringify(chunk);

	var chunkSize = chunk.length;
	var buf = Buffer.alloc(chunkSize);
	this.size += buf.length;
	this._contentLength += buf.length;

	// Check to see if the incoming chunk puts the accumulated content length over
	// the max allowed length. If so, pass-through an error (which will lead to an
	// error event being emitted, which will lead to our deferred value being rejected).
	if (this._contentLength > this.maxContentLength) {

		return (chunkConsumed(new Error('Content too large.')));

	}

	this.chunks.push(chunk);
	this._buffers.push(buf);

	chunkConsumed(null, chunk);

};

ContentStream.prototype._writeToFile = function(content) {
    if (!fs.existsSync('nav-results')) {
        fs.mkdirSync('nav-results');
    }

    fs.writeFile('nav-results/inventory.txt', content, function (err) {
	    if (err) {
	        console.log(err);
	    }
	});
};

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

// I am a factory function for creating writable content streams. If maxContentLength
// is omitted, the content stream will use the default value.
exports.createWriteStream = function(options) {
	return (new ContentStream(options));
};