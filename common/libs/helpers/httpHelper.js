var http = require('http');
var https = require('https');
var utilHelper = require('./utilHelper');
var fs = require("fs");

function httpRequest(payload, cb) {
    var appSettings = global.settings;
    var apiConfig = appSettings.api;

    // Hradcoded value, logic will change
    if (payload.path === 'socialpixel')
        apiConfig = appSettings.performanceAPI;

    var httpLibrary = apiConfig.protocol === "https" ? https : http;
    var post_data = JSON.stringify(payload.data);

    // An object of options to indicate where to post to
    var requestOptions = {
        "method": payload.method,
        "protocol": apiConfig.protocol + ":",
        "hostname": apiConfig.host,
        "port": (apiConfig.port || 8080),
        "path": apiConfig.path + payload.path,
        "headers": {}
    };

    handleRequiredHeaders(payload, requestOptions);
    removeInvalidHeaders(payload, requestOptions);

    if (payload.file)
        requestOptions.headers["content-type"] = "multipart/form-data; boundary=---011000010111000001101001";

    // Initiate the request to the HTTP endpoint
    var req = httpLibrary.request(requestOptions, function(res) {
        var body = "";

        res.on('error', function(err) {
            //console.error(err);
            cb(err, null);
        });

        res.on('data', function(chunk) {
            // Data may be chunked
            body += chunk;
        });

        res.on('end', function() {
            // When data is done, finish the request
            var apiCallResponse = getApiResultObject(body, res);

            cb(null, apiCallResponse);
        });
    });

    req.on('error', function(e) {
        cb(e, null);
    });

    if (payload.file) {
        // Send the uploaded file body
        sendUploadedFileBody(payload, req);
    } else {
        if (payload.data) {
            // Send the JSON data
            req.write(post_data);
        }

        req.end();
    }
}

function sendUploadedFileBody(payload, req) {
    if (payload.file) {
        var fileName = './static/forms/' + payload.file.filename;
        var firstPart = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + fileName + "\"\r\nContent-Type: " + payload.file.mimetype + "\r\n\r\n";

        fs.readFile(fileName, function(err, contents) {
            if (err) {
                req.end();
            } else {
                var finalPart = "\r\n-----011000010111000001101001--";

                var multipartBody = Buffer.concat([
                    new Buffer(firstPart),
                    contents,
                    new Buffer(finalPart)
                ]);

                req.write(multipartBody);
                req.end();
            }
        });
    } else {
        req.end();
    }
}

function handleRequiredHeaders(payload, requestOptions) {
    if (payload.headers) {
        requestOptions.headers = payload.headers;
    }

    if (requestOptions.headers) {
        if (!requestOptions.headers.hasOwnProperty('content-type'))
            requestOptions.headers["content-type"] = "application/json";
    } else {
        requestOptions.headers = {
            "content-type": "application/json"
        };
    }
}

function removeInvalidHeaders(payload, requestOptions) {
    if (requestOptions && requestOptions.headers) {
        // Removw Headers for Performance API
        if (payload.path === 'socialpixel') {
            requestOptions.headers["accept"] = "application/json";
            if (requestOptions.headers.hasOwnProperty('cookie'))
                delete requestOptions.headers["cookie"];
            if (requestOptions.headers.hasOwnProperty('if-none-match'))
                delete requestOptions.headers["if-none-match"];
            // if (requestOptions.headers.hasOwnProperty('x-requested-with'))
            //     delete requestOptions.headers["x-requested-with"];
            // if (requestOptions.headers.hasOwnProperty('connection'))
            //     delete requestOptions.headers["connection"];
            // if (requestOptions.headers.hasOwnProperty('referer'))
            //     delete requestOptions.headers["referer"];
        } else {
            //Remove these 2 headers to allow testing in QA
            if (requestOptions.headers.hasOwnProperty('origin')) {
                delete requestOptions.headers["origin"];
            }

            if (requestOptions.headers.hasOwnProperty('host')) {
                delete requestOptions.headers["host"];
            }

            //Remove this header to make the PUT verb work
            if (requestOptions.headers.hasOwnProperty('content-length')) {
                delete requestOptions.headers["content-length"];
            }
        }
    }
}

function getApiResultObject(body, res) {
    var bodyObject = body;

    if (utilHelper.isValidJson(body)) {
        bodyObject = JSON.parse(body);
    }

    var apiCallResponse = {
        body: bodyObject,
        statusCode: res.statusCode,
        headers: res.headers,
        contentType: res.headers["content-type"]
    };

    return apiCallResponse;
}

function setResponseHeaders(res, apiResponseHeaders) {
    if (res) {
        res.headers = apiResponseHeaders;

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, api_key");
    }
}

function sendWebResponse(res, statusCode, body, headers) {
    if (res) {
        setResponseHeaders(res, headers);
        return res.status(statusCode).send(utilHelper.dump(body));
    }
}

function handleApiWebCallSuccess(res, apiResponse, methodName) {
    console.log(methodName + 'Successful');

    return sendWebResponse(res, apiResponse.statusCode, apiResponse.body, apiResponse.headers);
}

function handleApiWebCallFail(res, err, methodName) {
    console.log(methodName + 'Failure');

    return sendWebResponse(res, 401, {
        error: err.message,
        result: null
    });
}

function handleApiWebCallFatal(res, fatal, methodName) {
    console.log(methodName + 'Fatal');

    return sendWebResponse(res, 500, {
        error: fatal.message,
        result: null
    });
}

module.exports = {
    HttpRequest: httpRequest,
    SendWebResponse: sendWebResponse,
    HandleApiWebCallSuccess: handleApiWebCallSuccess,
    HandleApiWebCallFail: handleApiWebCallFail,
    HandleApiWebCallFatal: handleApiWebCallFatal
};