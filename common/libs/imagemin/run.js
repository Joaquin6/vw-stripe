var fs = require("fs"),
	path = require("path"),
	colors = require("colors"),
	mkdirp = require("fs-mkdirp"),
	imagemin = require("imagemin"),
	imageminGifsicle = require("imagemin-gifsicle"),
	imageminJpegtran = require("imagemin-jpegtran"),
	imageminPngquant = require("imagemin-pngquant"),
	imageminSvgo = require("imagemin-svgo"),
	Q = require("q"),
	_ = require("underscore"),
	imageRootPath = path.resolve(__dirname, '..', '..', 'images', 's3'),
	imageDestinationPath = path.resolve(__dirname, '..', '..', '..', 'release', 'images', 's3');

readSourceDir().then(function(dirTree) {
	var promises = [];
	var parentDirs = _.allKeys(dirTree);
	parentDirs.forEach(function(parent, idx) {
		var inputDir = imageRootPath + "/" + parent;
		var outputDir = imageDestinationPath + "/" + parent;

		var childDirs = _.allKeys(dirTree[parent]);

		if (childDirs.length) {
			for (var y = 0; y < childDirs.length; y++) {
				var newInputDir = inputDir + "/" + childDirs[y] + "/*";

				var newOutputDir = outputDir + "/" + childDirs[y];
				var promise = minifyImages([newInputDir], newOutputDir);
				promises.push(promise);
			}
		} else {
			var newInputDir = inputDir + "/*";
			var promise = minifyImages([newInputDir], outputDir);
			promises.push(promise);
		}
	});

	Q.allSettled(promises).then(function(results) {
        var isError = false,
            errorResult;
        results.forEach(function(result) {
            if (result.state !== 'fulfilled') {
                isError = true;
                errorResult = result;
            }
        });
        if (isError) {
            console.log(colors.red("!!! " + errorResult.reason));
            errorResult.message = errorResult.reason;
            throw Error(errorResult);
        } else {
        	console.log(colors.green("--- Image Minifier: Completed Successfully"));
        }
    }).done();
}).fail(function(err) {
	console.log(err);
}).done();

function readSourceDir() {
	var deferred = Q.defer();
	var dirTree = {};

	walk(imageRootPath, function(filePath, stat) {
		console.log(colors.green(filePath));

		var imgFilePath = filePath.split("images/s3/")[1];
		imgFilePath = imgFilePath.split("/");

		var typeDir = imgFilePath[0];
		var brandDir = imgFilePath[1];
		var fileName = imgFilePath[2];

		if (!_.has(dirTree, typeDir)) {
			dirTree[typeDir] = {};
		}

		if (!_.has(dirTree[typeDir], brandDir)) {
			dirTree[typeDir][brandDir] = [];
		}

		if (!_.contains(dirTree[typeDir][brandDir], fileName)) {
			dirTree[typeDir][brandDir].push(fileName);
		}

		Q.delay(2000).done(function() {
			deferred.resolve(dirTree);
		});
	});

	return deferred.promise;
}

function walk(currentDirPath, callback) {
	fs.readdir(currentDirPath, function(err, files) {
		if (err) {
			throw new Error(err);
		}

		for (var i = 0; i < files.length; i++) {
			var name = files[i];
			if (name.charAt(0) === '.') {
				/** Skip hidden files/directories */
				continue;
			}

			var filePath = path.join(currentDirPath, name);
			var stat = fs.statSync(filePath);
			if (stat.isFile()) {
				callback(filePath, stat);
			} else if (stat.isDirectory()) {
				walk(filePath, callback);
			}
		}
	});
}

function minifyImages(inputs, output) {
	var deferred = Q.defer();

	imagemin(inputs, output, {
		cache: false,
		plugins: [
			imageminGifsicle({}),
			imageminJpegtran({}),
			imageminPngquant({}),
			imageminSvgo({})
		]
	}).then(function(files) {
		files.forEach(function(file, index, array) {
			console.log(colors.green(file.path));
		});
		deferred.resolve(files);
	});

	return deferred.promise;
}