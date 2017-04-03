/**
 * @module libs/mssql
 * @type {Object}
 * @fileOverview  This Module will be responsible for making sure a proper connection has been established.
 */

var util = require('util'),
	Q = require('q'),
	_ = require('underscore'),
	Helprs = require('helprs'),
	sql = require('mssql'),
    ReadableStrm = require('readable-stream'),
	colors = require('libs/colors'),
	debug = require('libs/buglog'),
	log = debug('libs', 'mssql'),
	logger = require('libs/logger'),
	SqlEvtObj = require('libs/helpers/evtTarget'),
	contentStream = require('libs/helpers/content-stream'),
	Exectimer = require('libs/helpers/exectimer'),
	dbStructure = require('./structure'),
	qryBuilder = require('./querybuilder');

require('clarify');

sql.Promise = Q;

var invRecCount = 0;
var connectionSettings = null;
var sqlConnection = null;
var connectionState = 'closed';

var connectStatus = new SqlEvtObj();

var mssqlObject = {
	/**
	 * Method to cross reference Part numbers in NAV.
	 * The method will query table `[Vision Wheel, Inc_$E-Comm Cust Sales Price]`
	 * with the provided part number for existence.
	 * @param   {Object}  parameters    Parameters containing what to search for
	 * @example <caption>Example Usage of the Parameters Object</caption>
	 * {
	 *     partNumber: "58M5665MBMF38"
	 * }
	 * @param   {Object}  options       Options properties have not yet been applied.
	 * @return  {Object|Array}                Results from the query.
	 */
	crossReference: function(parameters, options) {
		var deferred = Q.defer();
		parameters = parameters || {};
		options = options || {};

		if (!parameters.part_number && !parameters.privateLabel) {
			var hint = "No Part Number was Provided.";
			hint += "\nNo Private Label was Provided.";
			hint += "\nIf no Part Number is provided then a Private Label MUST be provided.";
			var err = Helprs.err("Bad Parameters Provided.", {
				statusCode: 1002,
				parameters: parameters,
				hint: hint
			});
			deferred.reject(err);
		} else {
			__crossReference(parameters, options).then(function(response) {
				deferred.resolve(response);
			}).fail(function(err) {
				deferred.reject(err);
			}).done();
		}

		return deferred.promise;
	},
	initialize: function(settings, callback) {
		if (!connectionSettings && settings) {
			if (settings.mssqlDatabase)
				connectionSettings = settings.mssqlDatabase;
		}

		if (!settings && connectionSettings)
			settings = connectionSettings;

		if (settings.environment === "development")
			settings.debug = true;

		if (settings.mssqlDatabase)
			settings = settings.mssqlDatabase;

		dbStructure.initialize(settings);

		sqlConnection = new sql.Connection(__buildConfig(settings));

		sqlConnection.connect(function(err) {
			if (err) {
				log("Database Connection Failed!");
				if (err.ConnectionError) {
					switch (err.ConnectionError) {
						case "ELOGIN":
							log("Login Failed!\n");
							break;
						case "ETIMEOUT":
							log("Connection timeout!\n");
							break;
						case "EALREADYCONNECTED":
							log("Database is already connected!\n");
							break;
						case "EALREADYCONNECTING":
							log("Already connecting to database!\n");
							break;
						case "EINSTLOOKUP":
							log("Instance lookup failed!\n");
							break;
						case "ESOCKET":
							log("Socket error!\n");
							break;
					}
				}
				log(err);
				if (connectionSettings.environment === "development")
					logger.error(err);
				if (callback)
					return callback(err);
				throw err;
			} else {
				log("\tInitialized");
				connectStatus.open();
				if (callback)
					return callback();
			}
		});
	},
	testConnection: function(settings, callback) {
		if (!connectionSettings && settings) {
			if (settings.mssqlDatabase)
				connectionSettings = settings.mssqlDatabase;
		}

		if (!settings && connectionSettings)
			settings = connectionSettings;

		if (settings.mssqlDatabase)
			settings = settings.mssqlDatabase;

		sqlConnection = new sql.Connection(__buildConfig(settings));

		sqlConnection.connect(function(err) {
			if (err) {
				if (callback)
					return callback(err);
				else
					throw err;
			} else {
				sqlConnection.close();
				if (callback)
					return callback();
			}
		});
	},
	getNavInventory: function() {
		var deferred = Q.defer();

		Exectimer.time("getNavInventory()");

		__getLocationInventoryData().then(function(inventory) {
			log("Writable Stream Retrieved (%s) Records Total", colors.green(invRecCount));

			//var parsedInventory = __parseLocInventory(inventory);

			if (!_.isEmpty(inventory)) {
				log(Exectimer.timeEnd("getNavInventory()"));
				deferred.resolve(inventory);
			} else {
				log(Exectimer.timeEnd("getNavInventory()"));
				deferred.reject(Helprs.err("No Records Found", {
					statusCode: 1003
				}));
			}
		}).fail(function(err) {
			deferred.reject(err);
		}).done();

		return deferred.promise;
	},
	getItemPricing: function(parameters, options) {
		var deferred = Q.defer();

		parameters = parameters || {};
		options = options || {};

		// Why is this not in the method call if it is a fixed value?
		// options.type = "pricing";

		// What's the point of adding an empty array in a function that doesn't do anything with it?
		// Not even being used.
		// options.pricedItems = [];

		// Why is this not handled in the method call?
		// if (!options.category)
		// 	options.category = "retail";


		// Why is there logic just for logging...

		// var itm = "Item";
		// if (items.length > 1)
		// 	itm += "s";

		// if (options.category === "dealer") {
		// 	var dealerId = null;
		// 	if (options.dealer)
		// 		dealerId = options.dealer.id;
		// 	if (dealerId)
		// 		log("Getting Dealer (%s) Specific Pricing for %d %s", colors.yellow(dealerId), items.length, itm);
		// 	else
		// 		log("Getting Dealer Specific Pricing BUT No Dealer Reference was Supplied");
		// } else
		// 	log("Getting Retail Pricing for %d %s", items.length, itm);

		__getItemPricingData({
			items: parameters.items,
			user: parameters.user
		}, options ).then(function(pricedItems) {
			deferred.resolve(pricedItems);
		}).fail(function(err) {
			if (connectionSettings.environment === "development")
				logger.error(err);
			deferred.reject(err);
		}).done();

		return deferred.promise;
	},
	getItems: function(options) {
		var deferred = Q.defer();
		options = options || {};
		options.type = "items";

		__getItemData(options).then(function(items) {
			deferred.resolve(items);
		}).fail(function(err) {
			if (connectionSettings.environment === "development")
				logger.error(err);
			deferred.reject(err);
		}).done();

		return deferred.promise;
	},
	getItemTable: function() {
		var itemTable = dbStructure.get({
			from: "tables.items"
		});
		return itemTable;
	},
	getTableProperties: function() {
		return __validateConnection()
			.then(__infoSchemaTables);
	},
	publishPurchaseOrder: function(parameters) {
		var deferred = Q.defer();

		var purchaseOrder = parameters.purchaseOrder;
		var shippingRates = parameters.shippingRates;
		var warehouses = parameters.warehouses;

		__publishPO({
			purchaseOrder: purchaseOrder,
			shippingRates: shippingRates,
			warehouses: warehouses
		}).then(function(response) {
			deferred.resolve(response);
		}).fail(function(err) {
			if (connectionSettings.environment === "development")
				logger.error(err);
			deferred.reject(err);
		}).done();

		return deferred.promise;
	},
	searchXRefs: function(parameters, options) {
		return __validateConnection()
			.then(function() {
				return __searchXRefs(parameters, options);
			});
	}
};

module.exports = mssqlObject;

function __calculateTime( dateObj ) {
	var offset = "-06";
	// convert to msec
	// add local time zone offset
	// get UTC time in msec
	var utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
	// create new Date object for different city
	// using supplied offset
	return new Date( utc + (1 /* milliseconds */ * 1000 /* seconds */ * 60 /* minutes */ * 60 /* hour */ * offset) );
}

function __logRequestError(err) {
	var time = (new Date()).toLocaleString();
	log("\n================ " + time + " ===================\n");

	if (err.stack) {
		log(">>> WARNING: Long Stack Traces <<<");
		log(err.stack);
	}

	log("\n" + err.code + " - " + err.name + ": " + err.message + "\n");
	log("\n================ " + time + " ===================\n");
}

function __validateConnection() {
	var deferred = Q.defer();
	Exectimer.time("__validateConnection()");

	if (sqlConnection === null) {
		mssqlObject.initialize();
		connectStatus.on("open", function() {
			connectionState = "opened";
			log(Exectimer.timeEnd("__validateConnection()"));
			deferred.resolve(sqlConnection);
		});
	} else {
		if (sqlConnection.connected) {
			log(Exectimer.timeEnd("__validateConnection()"));
			deferred.resolve(sqlConnection);
		} else if (sqlConnection.connecting) {
			connectStatus.on("open", function() {
				connectionState = "opened";
				log(Exectimer.timeEnd("__validateConnection()"));
				deferred.resolve(sqlConnection);
			});
		}
	}

	return deferred.promise;
}

function __buildConfig(settings) {
	var config = {
		user: settings.username,
		password: settings.password,
		server: settings.host,
		database: settings.name,
		port: settings.port,
		connectionTimeout: settings.connectionTimeout || 15000,
		requestTimeout: settings.requestTimeout || 15000
	};

	return config;
}

function __getLocationInventoryData() {
	var deferred = Q.defer();

	Q.when(__validateConnection(), function(cntState) {
		var invTable = dbStructure.getInvTable();
		var locationCodes = dbStructure.getLocationCodes();
		var tableColumns = invTable.columns;
		var parsedRowData = {};

		var request = new sql.Request(sqlConnection);
		request.stream = true;

        var rst = new ReadableStrm();
        rst.wrap(request);

		var writableStream = contentStream.createWriteStream({
			objectMode: true
		});

		writableStream.then(function(content) {
			// content = "[" + content.replace(/(\}\{)/g, "},{") + "]";
			// deferred.resolve(JSON.parse(content));
            deferred.resolve(parsedRowData);
		}).catch(function(err) {
			log("Writable Stream Error: %O", err);
			deferred.reject(err);
		});

		invRecCount = 0;
		request.pipe(writableStream);
		request.query(qryBuilder.create({
			type: "inventory"
		}));

        request.on('info', function(info) {
			log("Request Info: %O", info);
		});

        request.on('error', function(err) {
			log("Request Content Error: %O", err);
		});

        request.on('row', function(row) {
			invRecCount++;
			var ready = writableStream.write(row);
			if (ready === false) {
				log("Writable Stream Needs time to catch up!");
                request.pause();
				writableStream.once('drain', function() {
                    log("Writable Stream is Drained!");
                    request.resume();
                });
			} else {
                var rowCode = row[tableColumns.locCode.name];

                if (!_.has(locationCodes, rowCode))
                    return log("Unsupported Location Code: %s", colors.cyan(rowCode));

                var rowNumber = row[tableColumns.itemNum.name];
                if (!_.has(parsedRowData, rowNumber)) {
                    parsedRowData[rowNumber] = {
                        part_number: rowNumber,
                        inventory: {}
                    };
                }

                var locQty = row[tableColumns.onHandQty.name] || 0;
                var locState = locationCodes[rowCode];
                if (!_.has(parsedRowData[rowNumber].inventory, locState))
                    parsedRowData[rowNumber].inventory[locState] = locQty;
                else
                    parsedRowData[rowNumber].inventory[locState] += locQty;
            }
		});

        request.on('done', function(affected) {
			writableStream.end();
		});
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
}

/**
 * @private
 * Function that is privately used by `publishPurchaseOrder`.
 * Used to publish a PO to NAV.
 * By the time this function resolves the following steps have successfully executed:
 *     1.)  A new `Order Header` has been created on NAV.
 *     2.)  All sale items pertaining to the new created sale have been saved
 *             and created on the `Vision Wheel, Inc_$Website Inbound Order Line` table in NAV.
 * @param   {Object}  parameters  [description]
 * @param   {Object}  options     [description]
 * @return  {Object}              [description]
 */
function __publishPO(parameters) {
	var deferred = Q.defer();

	var purchaseOrder = parameters.purchaseOrder;
	var shippingRates = parameters.shippingRates;
	var warehouses = parameters.warehouses;

	Q.when(__validateConnection(), function(cntState) {
		/**
		 * First, we must Publish all PO headers
		 * at NAV Table `Vision Wheel, Inc_$Website Inbound Order Header`
		 */
		var publishedPO = {
			header: null,
			lines: null
		};
		var locationHeaders = __parseLocationHeaders({
			purchaseOrder: purchaseOrder,
			shippingRates: shippingRates,
			warehouses: warehouses
		});

		console.dir( "locationHeaders" );
		console.dir( "locationHeaders" );
		console.dir( "locationHeaders" );
		console.dir( "locationHeaders" );
		console.dir( "locationHeaders" );
		console.dir( "locationHeaders" );
		console.dir( locationHeaders );

		__publishPOHeaders({
			locationHeaders: locationHeaders,
			purchaseOrder: purchaseOrder
		}).then(function(publishedHeaders) {
			publishedPO.header = publishedHeaders;
			/**
			 * Next, we must publish all PO lines
			 * at NAV Table `Vision Wheel, Inc_$Website Inbound Order Line`
			 */
			__publishPOLines({
				locationHeaders: locationHeaders,
				publishedPO: publishedPO,
				purchaseOrder: purchaseOrder
			}).then(function(publishedLines) {
				publishedPO.lines = publishedLines;
				deferred.resolve(publishedPO);
			}).fail(function(err) {
				deferred.reject(err);
			}).done();
		}).fail(function(err) {
			deferred.reject(err);
		}).done();
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
}

function __getItemData() {
	var deferred = Q.defer();

	Q.when(__validateConnection(), function(cntState) {
		var sqlSource = [];
		var request = new sql.Request(sqlConnection);
		request.stream = true;

		request.query(qryBuilder.create({
			type: "items"
		}));

		request.on('row', function(row) {
			sqlSource.push(row);
		});

		request.on('error', function(err) {
			deferred.reject(err);
		});

		request.on('done', function(affected) {
			deferred.resolve(sqlSource);
		});
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
}

function __getItemPricingData(parameters, options) {
	var deferred = Q.defer();

	var items = parameters.items;
	var user = parameters.user;

	// This is required, why is it an option?
	// Not even being used in this function.
	// var category = options.category;
	var promises = [];
	var collectedRecordsets = {};

	Q.when(__validateConnection(), function(cntState) {
		var itemPartNumbers = [];
		for (var u = 0; u < items.length; u++) {
			var item = items[u];
			var part_number = item.part_number;
			var promise = __getPerItemPricingData({
				item: item,
				user: user
			}, options );
			log("\tItem Pricing for Part Number: ", part_number);
			itemPartNumbers.push( part_number );
			promises.push(promise);
		}

		Q.allSettled(promises).then(function(results) {
			var fulfilledValues = [];
			var errorResults = [];
			var hasErrors = false;

			results.forEach(function(result) {
				if (result.state !== 'fulfilled') {
					hasErrors = true;
					errorResults.push(result);
				}
			});

			if (hasErrors) {
				deferred.reject(errorResults);
			} else {

				results.forEach(function(result) {
					var recordsets = result.value;
					if (recordsets.length) {
						for (var c = 0; c < recordsets.length; c++) {
							var recordset = recordsets[c];
							var recordsetItemNum = recordset["Item No_"];
							var recordsetItemPrice = recordset["Unit Price"];

							if (!_.has(collectedRecordsets, recordsetItemNum))
								collectedRecordsets[recordsetItemNum] = recordsetItemPrice;
						}
					}
				});

				if (!_.isEmpty(collectedRecordsets)) {
					/**
					 * If `collectedRecordsets` is not empty, ths means we successfully,
					 * obtained records from NAV. If its empty, then no records were found.
					 */
					var collectedRecordsetsIds = _.allKeys(collectedRecordsets);
					if (collectedRecordsetsIds.length === itemPartNumbers.length) {
						deferred.resolve(collectedRecordsets);
					} else {
						/**
						 * Successfully obtained records from NAV, however results count does not match
						 * the number of items that need pricing.
						 */
						deferred.reject(Helprs.err("All Records Could Not Be Found", {
							hint: "Query executed successfully, but it resulted in missing Records",
							items: items,
							options: options,
							statusCode: 1001
						}));
					}
				} else {
					/**
					 * No Records Founds in NAV.
					 * This means we will reject the promise.
					 */
					deferred.reject(Helprs.err("No Records Found", {
						hint: "Query executed successfully, but it resulted in 0 Records",
						items: items,
						options: options,
						statusCode: 1001
					}));
				}
			}
		}).done();
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
}

function __getPerItemPricingData(parameters, options) {
	var deferred = Q.defer();

	var item = parameters.item;
	var user = parameters.user;
	var dealer = user.dealer || null;
	var category = dealer ? "dealer" : "retail";

	var request = new sql.Request(sqlConnection);

	// request.connectionTimeout = 60000;

	var queryresult = qryBuilder.create({
		dealer: dealer,
		type: "pricing",
		category: category,
		item: item
	});

	request.query(queryresult, function(err, recordset) {
		if (err)
			deferred.reject(err);
		else
			deferred.resolve(recordset);
	});

	return deferred.promise;
}

function __parseLocInventory(inventory) {
	Exectimer.time("__parseLocInventory()");

	var parsedRowData = {};
	var invCount = invRecCount;
	var invTable = dbStructure.getInvTable();
	var locationCodes = dbStructure.getLocationCodes();
	var tableColumns = invTable.columns;



	for (var f = 0; f < invCount; f++) {
		var row = inventory[f];
		var rowCode = row[tableColumns.locCode.name];

		if (!_.has(locationCodes, rowCode))
			continue;

		var rowNumber = row[tableColumns.itemNum.name];
		if (!_.has(parsedRowData, rowNumber)) {
			parsedRowData[rowNumber] = {
				part_number: rowNumber,
				inventory: {}
			};
		}

		var locQty = row[tableColumns.onHandQty.name] || 0;
		var locState = locationCodes[rowCode];
		if (!_.has(parsedRowData[rowNumber].inventory, locState))
			parsedRowData[rowNumber].inventory[locState] = locQty;
		else
			parsedRowData[rowNumber].inventory[locState] += locQty;

	}

	log(Exectimer.timeEnd("__parseLocInventory()"));
	return parsedRowData;
}

function __parseItemPricing(pricing) {
	if (typeof pricing !== 'string')
		pricing = pricing.toString();
	pricing = parseFloat(Math.round(pricing * 100) / 100).toFixed(2);

	return pricing;
}

function __parseLocationHeaders( parameters ) {
	var purchaseOrder = parameters.purchaseOrder;
	var shippingRates = parameters.shippingRates;
	var warehouses = parameters.warehouses;

	// var order = parameters.order;
	// var options = parameters.options;
	// var warehouses = options.warehouses;
	// var savedSale = options.savedPurchaseOrder.savedSale;
	// var savedSaleItems = options.savedPurchaseOrder.savedSaleItems;
	// var shippingTotalsPerLocation = options.shippingTotalsPerLocation;

	var savedSale = purchaseOrder.savedSale;
	var savedSaleItems = purchaseOrder.savedSaleItems;

	console.dir( "purchaseOrder" );
	console.dir( "purchaseOrder" );
	console.dir( "purchaseOrder" );
	console.dir( "purchaseOrder" );
	console.dir( "purchaseOrder" );
	console.dir( purchaseOrder );

	var created = savedSale.created;
	var customerId = savedSale.customer_id;
	var customer_info = savedSale.customer_info;
	var customer_billing_info = savedSale.customer_billing_info;
	var discounttotal = savedSale.total_discount_amount;
	var payment = savedSale.payment;
	var poNumber = savedSale.po_number;
	var ship_to_info = savedSale.ship_to_info;
	var taxtotal = savedSale.tax_amount;
	var total = savedSale.total_invoice_amount;
	var web_order_number = savedSale.web_order_number;
	var web_master_order_number = web_order_number.replace( /-/g, "" ).trim();

	var locations = [];
	var line_num_counter = 0;
	var toDecimalRegex = /[^0-9\.]+/g;
	var posubmissiontracker = {
		headers: 0,
		lineitems: 0
	};
	var CCDetails = {
		ccStatus: null,
		ccAuthCode: null,
		ccAuthDate: null
	};

	// TODO: better validation
	// Not very effective or useful
	// if( ship_to_info.country === "United States" || ship_to_info.country === "USA" ) {
	// 	ship_to_info.country = "US";
	// }
	// else if( ship_to_info.country === "Canada" ) {
	// 	ship_to_info.country = "CAN";
	// }

	/**
	 * Correct UTC Created Time from Postgres
	 * http://stackoverflow.com/questions/10797720/postgresql-how-to-render-date-in-different-time-zone
	 * var cstCreated = Moment( created ).utcOffset( "-06:00:00" );
	 */
	// var userOffset = created.getTimezoneOffset() * 60 * 1000; // offset time
	// var centralOffset = 6 * 60 * 60 * 1000; // 6 for central time
	// created = new Date( created.getTime() - centralOffset ); // redefine variable

	// var orderDate = created.getDate() + "-" + (created.getMonth() + 1) + "-" + created.getFullYear()
	// log( "Created Date in CST: Date: %s, Time: %s", orderDate );
	var createdCST = __calculateTime( created );
	console.log( "Datetime in CST: %s", createdCST.toLocaleString() )
	console.log( "Datetime in CST: %s", createdCST.toUTCString() )
	console.log( "Datetime in CST: %s", createdCST.toString() )
	console.log( "Datetime in CST: %s", createdCST )
	console.log( createdCST )

	/** Check if the PO was payable and a Stripe Transaction took place */
	if( payment.payment_method === "CREDIT CAR" ) {
		/** ONLY log this during 'development' environment */
		console.log( "Verified Stripe CC Transaction" );
		/** If so, add all CC Information to submit to NAV */
		CCDetails.ccStatus = payment.CCStatus;
		CCDetails.ccAuthCode = payment.CCAuthCode;
		/** @type {Number|Timestamp} Convert the CCAuthDate from timestamp to formatted */
		// CCDetails.ccAuthDate = Moment( payment.CCAuthDate * 1000 ).format( "DD-MM-YYYY" );
		var date = createdCST.getDate().toString();
		var month = (createdCST.getMonth() + 1).toString();
		var year = createdCST.getFullYear().toString();
		date = date.length === 1 ? "0" + date : date;
		month = month.length === 1 ? "0" + month : month;
		CCDetails.ccAuthDate = [date, month, year].join( "-" );
		console.log( "These CC details will be added to the Headers: %o", CCDetails );
	}

	for( var state in warehouses ) {
		var warehouse = warehouses[state];
		var whDetails = warehouse.details;
		var whItems = warehouse.items;
		var whLocationCode = whDetails.locationCode;

		var shippingtotal;

		if( shippingRates ) {
			shippingtotal = shippingRates.filter(function( wh ) {
				return wh.from === state;
			})[0].shippingtotal;
		}

		shippingtotal = shippingtotal ? shippingtotal : 0;
		console.log( "Shipping Total for %s is %d", state, shippingtotal );

		var locationPO = {
			header: null,
			lines: []
		};

		var shipping_agent = "ups";
		var shipping_method = warehouse.method;
		var eship_agent_service_code = "ground";
		if( warehouse.option ) {
			if( warehouse.option === "2 day" ) {
				warehouse.option = "2nd day";
				eship_agent_service_code = warehouse.option;
			}
			if( info.option === "2nd day" || "overnight" ) {
				shipping_method = "expedited";
			}
		}
		if( shipping_method === "ltl" ) {
			shipping_agent = "ltl";
		}
		else if( shipping_method === "pickup" ) {
			eship_agent_service_code = shipping_agent = "cpu";
			shipping_method = "pickup cpu";
		}

		var location = {
			docNum: web_order_number + "-" + whDetails.locationCode,
			docType: 0,
			orderDate: createdCST.getDate() + "-" + (createdCST.getMonth() + 1) + "-" + createdCST.getFullYear(),
			externalDocNum: poNumber,
			locationCode: whLocationCode,
			customerNum: customerId,
			shipToName: customer_billing_info.customer_name,
			shipToAddress: ship_to_info.address_1,
			shipToAddress2: ship_to_info.address_2,
			shipToPostCode: ship_to_info.zip,
			shipToCity: ship_to_info.city,
			shipToCounty: ship_to_info.state,
			shipToCountryCode: ship_to_info.country,
			addShipToCodeToNAV: 0,
			shippingAgent: shipping_agent,
			shipmentMethod: shipping_method,
			eShipAgentService: eship_agent_service_code,
			paymentMethod: payment.payment_method,
			freightTotal: shippingtotal ? Number( shippingtotal ) : 0,
			totalDiscountAmount: discounttotal ? Number( discounttotal.replace( toDecimalRegex, "" ) ) : 0,
			taxAmount: taxtotal ? Number( taxtotal.replace( toDecimalRegex, "" ) ) : 0,
			totalInvoiceAmount: total ? Number( total.replace( toDecimalRegex, "" ) ) : 0,
			websiteUserEmailAddress: customer_info.email,
			customerPhone: customer_info.phone,
			storeNo: ship_to_info.store_number,
			webmasterOrderNum: web_master_order_number
		};

		/** Extend with the CC Details */
		if( location.paymentMethod === "CREDIT CAR" ) {
			// location = _.extend( location, CCDetails );
			for( var key in CCDetails ) {
				location[key] = CCDetails[key];
			}
		}

		locationPO.header = location;
		posubmissiontracker.headers++;

		for( var z = 0; z < whItems.length; z++ ) {
			var whItem = whItems[z];
			var savedSaleItem = null;

			for( var q = 0; q < savedSaleItems.length; q++ ) {
				savedSaleItem = savedSaleItems[q];
				if( savedSaleItem.applied ) {
					continue;
				}
				if( savedSaleItem.item_no === whItem.item.part_number ) {
					savedSaleItem.applied = true;
					break;
				}
			}
			line_num_counter++;

			var line_item = {
				docNum: location.docNum,
				docType: 0,
				lineNum: line_num_counter,
				itemNum: savedSaleItem.item_no,
				qty: savedSaleItem.qty,
				unitPrice: Number( savedSaleItem.unit_price.replace( /[^0-9\.]+/g, "" ) ),
				taxAmount: Number( savedSaleItem.tax_amount.replace( /[^0-9\.]+/g, "" ) ),
				totalLineAmount: Number( savedSaleItem.total_line_amount.replace( /[^0-9\.]+/g, "" ) ),
				eCommLineType: 0
			};

			locationPO.lines.push( line_item );
			posubmissiontracker.lineitems++;
		}

		locations.push( locationPO );
	}

	console.log( "Total PO Submission Count: %o", posubmissiontracker );

	return locations;
}

function __publishPOHeaders(parameters) {
	var deferred = Q.defer();

	var locationHeaders = parameters.locationHeaders;
	var purchaseOrder = parameters.purchaseOrder;

	var promises = [];
	// var locationHeaders = options.perLocationPurchaseOrders;

	for (var u = 0; u < locationHeaders.length; u++) {
		var locationHeader = locationHeaders[u];
		var promise = __publishPOHeader(locationHeader.header, purchaseOrder);

		promises.push(promise);
	}

	Q.allSettled(promises).then(function(results) {
		var publishedHeaders = [];
		var errorResults = [];
		var hasErrors = false;

		results.forEach(function(result) {
			if (result.state !== 'fulfilled') {
				hasErrors = true;
				errorResults.push( result );
			} else {
				if (_.isArray(result.value))
					result.value = result.value[0];
				publishedHeaders.push(result.value);
			}
		});

		if (hasErrors) {
			deferred.reject(errorResults);
		} else {
			deferred.resolve(publishedHeaders);
		}
	}).done();

	return deferred.promise;
}

function __publishPOHeader(locationHeader, purchaseOrder) {
	var deferred = Q.defer();

	var request = new sql.Request(sqlConnection);

	var queryresult = qryBuilder.create({
		type: "publishpo",
		category: "header",
		locationHeader: locationHeader,
		savedWebOrder: purchaseOrder
	});

	request.query(queryresult, function(err, recordset) {
		if (err) {
			log(err.RequestError || "Bad Query Response.");
			deferred.reject(err);
		} else {
			if (!recordset || _.isEmpty(recordset))
				recordset = queryresult;
			deferred.resolve(recordset);
		}
	});

	return deferred.promise;
}

function __publishPOLines(parameters) {
	var deferred = Q.defer();

	var locationHeaders = parameters.locationHeaders;
	var publishedPO = parameters.publishedPO;
	var purchaseOrder = parameters.purchaseOrder;

	var promises = [];
	// var locationHeaders = options.perLocationPurchaseOrders;

	for (var e = 0; e < locationHeaders.length; e++) {
		var locationLines = locationHeaders[e].lines;

		for (var u = 0; u < locationLines.length; u++) {
			var locationLine = locationLines[u];
			// var promise = __publishPOLineItem(locationLine, parameters, options);
			var promise = __publishPOLineItem({
				locationLine: locationLine,
				publishedPO: publishedPO,
				purchaseOrder: purchaseOrder
			});

			promises.push(promise);
		}
	}

	Q.allSettled(promises).then(function(results) {
		var errorResult;
		var isError = false;
		var fulfilledValues = [];

		results.forEach(function(result) {
			if (result.state !== 'fulfilled') {
				isError = true;
				errorResult = result;
			} else {
				if (_.isArray(result.value))
					result.value = result.value[0];
				fulfilledValues.push(result.value);
			}
		});

		if (isError) {
			log(errorResult.reason);
			errorResult.message = errorResult.reason;
			deferred.reject(errorResult);
		} else {
			deferred.resolve(fulfilledValues);
		}
	}).done();

	return deferred.promise;
}

function __publishPOLineItem(parameters) {
	var deferred = Q.defer();

	var locationLine = parameters.locationLine;
	var publishedPO = parameters.publishedPO;
	var purchaseOrder = parameters.purchaseOrder;

	var request = new sql.Request(sqlConnection);

	var queryresult = qryBuilder.create({
		type: "publishpo",
		category: "line",
		savedWebOrder: purchaseOrder,
		locationLine: locationLine,
		publishedPO: publishedPO
	});

	request.query(queryresult, function(err, recordset) {
		if (err) {
			log(err.RequestError || "Bad Query Response.");
			deferred.reject(err);
		} else {
			if (!recordset || _.isEmpty(recordset))
				recordset = queryresult;
			deferred.resolve(recordset);
		}
	});

	return deferred.promise;
}

function __getItemCrossRefData(parameters, options) {
	var deferred = Q.defer();

	Q.when(__validateConnection(), function(cntState) {
		var sqlSource = [];
		var request = new sql.Request(sqlConnection);
		request.stream = true;

		request.query(qryBuilder.create({
			type: "crossreference",
			part_number: null, // parameters.part_number || null,
			privateLabel: parameters.privateLabel || null
		}));

		request.on('row', function(row) {
			sqlSource.push(row);
		});

		request.on('error', function(err) {
			deferred.reject(err);
		});

		request.on('done', function(affected) {
			deferred.resolve(sqlSource);
		});
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
}

function __crossReference(parameters, options) {
	var deferred = Q.defer();

	__getItemCrossRefData(parameters, options).then(function(items) {
		/** If matches to the Part number are found, check the Cross Reference Fields */
		var searchingPrivateLabel = parameters.privateLabel || null;
		var searchingPartNumber = parameters.part_number;
		var matchingReference = null;
		var crossRefColumnNames = dbStructure.getCrossReferenceColumns();

		for (var t = 0; t < items.length; t++) {
			var item = items[t];
			var itemNumber = item["Item No_"] || null;

			for (var h = 0; h < crossRefColumnNames.length; h++) {
				var crossRefColumnName = crossRefColumnNames[h];
				var crossRefColumnValue = item[crossRefColumnName] || null;

				if (!crossRefColumnValue)
					continue;

				if (crossRefColumnValue === searchingPartNumber) {
					matchingReference = item;
					matchingReference.crossReference = {
						columnOfReferenceFound: crossRefColumnName,
						referencedItemNumber: itemNumber,
						customerPrivateLabel: searchingPrivateLabel,
						searchedPartNumber: searchingPartNumber
					};
					break;
				}
			}
		}

		if (matchingReference)
			deferred.resolve(matchingReference);
		else {
			var errMsg = "No Cross Reference Found for Part Number: " + searchingPartNumber;
			var errRes = Helprs.err(errMsg, {
				statusCode: 1002,
				parameters: parameters
			});
			console.log(colors.red(errMsg));
			deferred.reject(errRes);
		}
	}).fail(function(err) {
		deferred.reject(err);
	}).done();

	return deferred.promise;
}

function __infoSchemaTables(cntState) {
	var deferred = Q.defer();

	var request = new sql.Request(sqlConnection);

	var queryresult = qryBuilder.create({
		type: "infoschema",
		category: "tables"
	});

	request.query(queryresult, function(err, recordset) {
		if (err) {
			log(err.RequestError || "Bad Query Response.");
			deferred.reject(err);
		} else {
			deferred.resolve(recordset);
		}
	});

	return deferred.promise;
}

function __searchXRefs(parameters, options) {
	var deferred = Q.defer();

	var request = new sql.Request(sqlConnection);

	var queryresult = qryBuilder.create({
		type: "search",
		category: "xrefs",
		dealer: options.dealer,
		term: parameters.term
	});

	request.query(queryresult, function(err, recordset) {
		if (err) {
			log(err.RequestError || "Bad Query Response.");
			deferred.reject(err);
		} else {
			log("Successful XREF NAV Search");
			deferred.resolve(recordset);
		}
	});

	return deferred.promise;
}