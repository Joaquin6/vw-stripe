/*

Queue.js

A function to represent a queue

Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
the terms of the CC0 1.0 Universal legal code:

http://code.stephenmorley.org/javascript/queues/
http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

/* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
 * items are added to the end of the queue and removed from the front.
 */
function Queue(){

  // initialise the queue and offset
  var queue  = [];
  var offset = 0;

  // Returns the length of the queue.
  this.getLength = function(){
    return (queue.length - offset);
  }

  // Returns true if the queue is empty, and false otherwise.
  this.isEmpty = function(){
    return (queue.length == 0);
  }

  /* Enqueues the specified item. The parameter is:
   *
   * item - the item to enqueue
   */
  this.enqueue = function(item){
    queue.push(item);
  }

  /* Dequeues an item and returns it. If the queue is empty, the value
   * 'undefined' is returned.
   */
  this.dequeue = function(){

    // if the queue is empty, return immediately
    if (queue.length == 0) return undefined;

    // store the item at the front of the queue
    var item = queue[offset];

    // increment the offset and remove the free space if necessary
    if (++ offset * 2 >= queue.length){
      queue  = queue.slice(offset);
      offset = 0;
    }

    // return the dequeued item
    return item;
  }

  /* Returns the item at the front of the queue (without dequeuing it). If the
   * queue is empty then undefined is returned.
   */
  this.peek = function(){
    return (queue.length > 0 ? queue[offset] : undefined);
  }

}

// function Queue() {
//     this._oldestIndex = 1;
//     this._newestIndex = 1;
//     this._storage = {};
// }

// Queue.prototype.size = function() {
//     return this._newestIndex - this._oldestIndex;
// };

// Queue.prototype.enqueue = function(data) {
//     this._storage[this._newestIndex] = data;
//     this._newestIndex++;
// };

// Queue.prototype.dequeue = function() {
//     var oldestIndex = this._oldestIndex,
//         newestIndex = this._newestIndex,
//         deletedData;

//     if (oldestIndex !== newestIndex) {
//         deletedData = this._storage[oldestIndex];
//         delete this._storage[oldestIndex];
//         this._oldestIndex++;

//         return deletedData;
//     }
// };
