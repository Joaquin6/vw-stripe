var defaultDateFormat = require("./dateformat");
var chalk = require("../../colors");
var util = require('util');

var defaults = {
    pattern: "",
    include: ["log", "info", "warn", "error", "dir", "assert"],
    exclude: [],
    disable: [],
    level: "log",
    extend: {},
    label: true,
    colors: {
        stamp: [],
        label: [],
        metadata: []
    }
};

module.exports = function(con, options, prefix_metadata) {

    // If the console is patched already, restore it
    if (con.__ts__ && "restoreConsole" in con) {
        con.restoreConsole();
    }

    var pattern;

    if (typeof options === "string") {
        // Fallback to version 0.1.x
        pattern = options;
        options = merge({}, defaults);
    } else {
        options = merge({}, defaults, (options || {}));
        pattern = options.pattern;
        prefix_metadata = prefix_metadata || options.metadata;
    }

    var stdout = options.stdout;
    var stderr = options.stderr || options.stdout;

    var levelPriorities = {
        log: 4,
        info: 3,
        warn: 2,
        error: 1,
        assert: 2,
        dir: 4
    };

    //Extend log levels
    levelPriorities = merge({}, levelPriorities, (options.extend || {}));

    var getAllowedLogFunctions = function(level) {
        var logFunctions = [],
            levelPriority = levelPriorities[level];

        for (var logFunction in levelPriorities) {
            if (levelPriorities.hasOwnProperty(logFunction)) {
                if (levelPriority >= levelPriorities[logFunction]) {
                    logFunctions.push(logFunction);
                }
            }
        }
        return logFunctions;
    };

    var dateFormat = options.formatter || defaultDateFormat,
        allowedLogFunctions = getAllowedLogFunctions(options.level);

    options.disable = options.disable.concat(options.include.filter(function(m) {
        return !~options.exclude.indexOf(m) && !~allowedLogFunctions.indexOf(m);
    }));

    options.include = options.include.filter(function filter(m) {
        return !~options.exclude.indexOf(m) && !~options.disable.indexOf(m);
    });

    //SET COLOR THEME START
    var noColor = function(str) {
        return str;
    }; //Default behaviour (no color)

    var getColor = function(origColor) {
        //If color is a chalk function already, just return it
        if (typeof origColor === 'function') {
            return origColor;
        }
        //If color is an string, check if a function in chalk exists
        if (typeof origColor === 'string') {
            return chalk["" + origColor] ? chalk["" + origColor] : noColor;
        }
        //If color is an array, check the contents for color strings
        if (Array.isArray(origColor)) {
            if (origColor.length > 0) {
                var color = chalk;
                for (var i = 0; i < origColor.length; i++) {
                    if (typeof origColor[i] === 'string') {
                        color = color["" + origColor[i]];
                    }
                }
                return color;
            } else {
                return noColor;
            }
        }
        return noColor;
    };

    var colorTheme = {};
    colorTheme.stamp = getColor(options.colors.stamp);
    colorTheme.label = getColor(options.colors.label);
    colorTheme.metadata = getColor(options.colors.metadata);
    //SET COLOR THEME END

    var original_functions = [];

    var slice = Array.prototype.slice;

    options.include.forEach(function(f) {

        original_functions.push([f, con[f]]);

        var org = con[f];

        con[f] = function() {

            var prefix = colorTheme.stamp("[" + dateFormat(pattern) + "]") + " ";
            var args = slice.call(arguments);

            // Add label if flag is set
            if (options.label) {
                prefix += colorTheme.label("[" + f.toUpperCase() + "]") + "      ".substr(f.length);
            }

            // Add metadata if any
            var metadata = "";
            if (typeof prefix_metadata === 'function') {
                metadata = prefix_metadata(f, args);
            } else if (typeof prefix_metadata === 'object') {
                metadata = util.inspect(prefix_metadata);
            } else if (typeof prefix_metadata !== 'undefined') {
                metadata = prefix_metadata;
            }

            if (metadata) {
                prefix += colorTheme.metadata(metadata) + " "; //Metadata
            }

            if (f === "error" || f === "warn" || (f === "assert" && !args[0])) {
                (stderr || process.stderr).write(prefix);
            } else if (f !== "assert") {
                (stdout || process.stdout).write(prefix);
            }

            return org.apply(con, args);

        };
    });

    options.disable.forEach(function(f) {

        original_functions.push([f, con[f]]);

        con[f] = function() {};

    });

    con.restoreConsole = function() {
        original_functions.forEach(function(pair) {
            con[pair[0]] = pair[1];
            delete con.__ts__;
        });
        delete con.restoreConsole;
    };

    con.__ts__ = true;

};

/**
 * Get type of variable
 * @param mixed input
 * @return string
 */
function typeOf(input) {
    return ({}).toString.call(input).slice(8, -1).toLowerCase();
}

/**
 * Clone the input removing any reference
 * @param mixed input
 * @return mixed
 */
function clone(input) {
    var output = input,
        type = typeOf(input),
        index, size;

    if (type === 'array') {
        output = [];
        size = input.length;
        for (index = 0; index < size; ++index)
            output[index] = clone(input[index]);
    } else if (type === 'object') {
        output = {};
        for (index in input)
            output[index] = clone(input[index]);

    }

    return output;

};

function merge() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var defaults = arguments[1];

    for (var key in defaults) {
        if (typeof obj[key] === 'undefined') {
            obj[key] = defaults[key];
        }
    }
    return obj;
}

/**
 * Merge two objects recursively
 * @param mixed input
 * @param mixed extend
 * @return mixed
 */
function merge_recursive(base, extend) {
    if (typeOf(base) !== 'object')
        return extend;

    for (var key in extend) {
        if (typeOf(base[key]) === 'object' && typeOf(extend[key]) === 'object') {
            base[key] = merge_recursive(base[key], extend[key]);
        } else {
            base[key] = extend[key];
        }
    }

    return base;
}