/**
 * @fileOverview File review notes will go here.
 * @author Mirum Shoper Team <joaquin.briceno@mirumshoper.com>
 * @module Queue
 */

var colors = require('libs/colors'),
	debug = require('libs/buglog'),
	log = debug("libs", "queue");

module.exports = {
	__queuedTasks : [],
	/**
	 * Adds the task to a queue.
	 * The task to be added is obtained thru the arguments.
	 * IMPORTANT NOTE: The last argument will be taken for a timer value if its a datatype of `number`.
	 * 	This is important, in case more arguments are passed. This means in order not to set a timer,
	 * 	make sure the last argument is NOT a datatype `number`. If the last argument is a number for
	 * 	your method task, you can bypass as follows:
	 * 	function (_someTaskFunction, this, param1, param2, param3(number), param4("")[empty string])
	 */
	add: function() {
		var timer = 3000;
		var firstArgument = arguments[0];
		var lastArgument = arguments[arguments.length - 1];

		if (firstArgument === undefined) {
			log('Error - queued up undefined function!');
			return;
		}

		this.__queuedTasks.push(arguments);
		log("Added Task - Total Tasks in Queue: " + this.__queuedTasks.length);

		if (lastArgument !== undefined && typeof lastArgument === 'number')
			timer = lastArgument * 60000;

		var msg = "Queue Timer for Task is set at ";
		if (timer === 3000)
			msg += "Default Amount";
		else
			msg += timer + " milliseconds";
		log(msg);

		this.__wait(timer);
	},
	__requestWork : function() {
		if (this.__queuedTasks.length === 0)
			return;
		// who knew javascript had a queue and stack built in?
		// http://codetunnel.com/9-javascript-tips-you-may-not-know/
		var task = this.__queuedTasks.shift();
		log("Executing Task - Total Tasks in Queue Left: " + this.__queuedTasks.length);
		this.__doTask(task);
		this.__wait();
	},
	__doTask : function(task) {
		var func = null;
		var ctx = null;
		if (task.length)
			func = task[0];
		if (task.length > 1)
			ctx = task[1];
		var args = [];
		for (var i = 2; i < task.length; i++)
			args.push(task[i]);
		try {
			func.apply(ctx, args);
		} catch (e) {
			log(e);
		}
	},
	__wait : function(timer) {
		var that = this;
		setTimeout(function() {
			that.__requestWork();
		}, timer);
	}
};