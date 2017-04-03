var _ = require( "underscore" ),
		Q = require( "q" ),
		EmailController = require( "controllers/email" ),
		debug = require( "libs/buglog" ),
		MSSQL = require( "libs/mssql" ),
		ShippingCalculator = require( "libs/shipping_calculator" ),
		Stripe = require( "libs/stripe" ),
		Taxapi = require( "libs/taxapi" ),
		Generic = require( "models/generic" ),
		Item = require( "models/public/item" ),
		Sale = require( "models/sales/sale" ),
		SaleItem = require( "models/sales/sale_item" ),
		SalesRep = require( "models/sales/salesrep" ),
		User = require( "models/membership/user" ),
		log = debug( "models", "checkout", "repository" );

module.exports = {
	findCartDetails: function( props ) {
		var deferred = Q.defer();

		var user = props.user;
		var userCart = user.cart;
		var userCartItems = userCart.items;
		var itemIds = _.allKeys( userCartItems );

		if( itemIds.length ) {
			Item.find({
				id: itemIds
			}, {
				excludePrivateLabelQuery: false
			}).then(function( items ) {
				deferred.resolve( items );
			}).fail(function( error ) {
				deferred.reject( error );
			}).done();
		}
		else {
			var items = [];
			deferred.resolve( items );
		}

		return deferred.promise;
	},
	findSalesRep: function( props ) {
		var deferred = Q.defer();

		var user = props.user;
		var userSalesRepId = user.sales_rep;

		SalesRep.findOne({
			id: userSalesRepId
		}).then(function( salesRepObj ) {
			deferred.resolve( salesRepObj );
		}).fail(function( error ) {
			deferred.reject( error );
		}).done();

		return deferred.promise;
	},
	generateWebOrderNumber: function( props ) {
		var deferred = Q.defer();

		var appSettings = props.appSettings;
		var environment = appSettings.environment;

		var envCode = "01";
		if( !environment ) {
			environment = process.env.NODE_ENV;
		}
		if( environment === "qa" ) {
			envCode = "02";
		}
		else if( environment === "development" ) {
			envCode = "03";
		}

		var wons = {
			"Latest Generated Web Order Number": null,
			"New Generated Web Order Number": null
		};

		Generic.getLastWebOrderNumberByEnv({
			envCode: envCode
		}).then(function( lastWebOrderNumber ) {
			var splitLWON = lastWebOrderNumber.split( "-" );
			var WebOrderNumber = null;
			var isEnvBasedWON = false;
			wons["Latest Generated Web Order Number"] = lastWebOrderNumber;
			/** Now put it back together and resolve. */
			splitLWON.forEach(function( roundset, index ) {
				if( index === 0 ) {
					if( roundset === "01" || roundset === "02" || roundset === "03" ) {
						isEnvBasedWON = true;
					}
					WebOrderNumber = roundset;
				}
				else if( (index + 1) === splitLWON.length ) {
					// If last, increment the value
					roundset = parseInt( roundset );
					roundset++;
					roundset = roundset.toString();
					WebOrderNumber += "-" + roundset;
				}
				else {
					WebOrderNumber += "-" + roundset;
				}
			});
			if( !isEnvBasedWON ) {
				WebOrderNumber = envCode + "-" + WebOrderNumber;
			}
			wons["New Generated Web Order Number"] = WebOrderNumber;
			deferred.resolve( wons );
		}).fail(function( error ) {
			log( "ERROR with DB Function 'getLastWebOrderNumberByEnv()'." );
			log( error );
			deferred.reject( error );
		}).done();

		return deferred.promise;
	},
	getShippingRates: function( props ) {
		var deferred = Q.defer();

		var shipping = props.shipping;
		var user = props.user;
		var warehouses = props.warehouses;

		var calculateTotals = true;
		for( var key in warehouses ) {
			var state = key;
			var stateOpts = warehouses[key];
			if( stateOpts.method === "ltl" || stateOpts.method === "expedited" ) {
				calculateTotals = false;
				break;
			}
		}
		if( calculateTotals ) {
			__getShippingRates({
				shipping: shipping,
				user: user,
				warehouses: warehouses
			}).then(function( shippingRates ) {
				deferred.resolve( shippingRates );
			}).catch(function( error ) {
				deferred.reject( error );
			});
		}
		else {
			var shippingRates = [];
			deferred.resolve( shippingRates );
		}

		return deferred.promise;
	},
	getItemPricing: function( props ) {
		var deferred = Q.defer();

		var user = props.user;
		var userCart = user.cart;
		var userCartItems = userCart.items;

		if( userCartItems.length ) {
			MSSQL.getItemPricing({
				items: userCartItems,
				user: user
			}).then(function( prices ) {
				deferred.resolve( prices );
			}).fail(function( error ) {
				if( error.message && error.message === "No Records Found" ) {
					if( error.hint ) {
						log( error.hint );
					}
				}
				deferred.reject( error );
			}).done();
		}
		else {
			var prices = {};
			deferred.resolve( prices );
		}

		return deferred.promise;
	},
	getTaxRate: function( props ) {
		var deferred = Q.defer();

		var shipping = props.shipping;
		var postalcode = shipping.postalcode;
		var user = props.user;
		var dealer = user.dealer;
		var isDealer = dealer ? true : false;
		var isTaxable = isDealer && dealer.taxable ? true : false;

		var taxST = {
			country: "USA",
			postal: postalcode
		};
		if( !isDealer || isTaxable ) {
			Taxapi.getTaxRateByZip( taxST ).then(function( taxRate ) {
				deferred.resolve( taxRate );
			}).fail(function( error ) {
				deferred.reject( error );
			}).done();
		}
		else {
			taxST.rate = 0;
			deferred.resolve( taxST );
		}

		return deferred.promise;
	},
	publishPurchaseOrder: function( props ) {
		var deferred = Q.defer();

		var purchaseOrder = props.purchaseOrder;
		var shippingRates = props.shippingRates;
		var warehouses = props.warehouses;

		// var order = props.order;
		// var options = props.options;

		log( "Now Publishing PO to NAV" );

		MSSQL.publishPurchaseOrder({
			purchaseOrder: purchaseOrder,
			shippingRates: shippingRates,
			warehouses: warehouses
		}).then(function( publishedPO ) {

			// * Now that we have submitted to NAV we will now take the extra step
			// * to save the inserted NAV records into our DB.

			__saveNavRecords( publishedPO, purchaseOrder ).then(function( savedRecords ) {
				log( "Successfully Updated Sale and Sale Items NAV Records." );
				// log( Exectimer.timeEnd( "submitPurchaseOrder()" ) );
				deferred.resolve( savedRecords );
			}).catch(function( error ) {
				var errorMessage = "Failed to Update Sale and/or Sale Items NAV Records";
				log( colors.red( errorMessage ) + ": %O", error );
				// logger.error( errorMessage );
				// logger.error( error );
				// log( Exectimer.timeEnd( "submitPurchaseOrder()" ) );
				deferred.reject( error );
			});
		}).fail(function( error ) {
			log( "Failed to Publish PO to NAV" );
			log( error );
			deferred.reject( error );
		}).done();

		return deferred.promise;
	},
	sendOrderEmail: function( orderID, options, renderEmail ) {
		return __findSale({ id: orderID }).then(function( order ) {
			return EmailController.sendOrderEmail( order, options, renderEmail );
		});
	},
	/*
		Used to submit a Purchase Order. This will save a new `sale` on
		the database. This will also save the sale's items in an additional
		table (sale_item).
		Here we also generate a `Web Order Number`.
		So it is not necessary to pass in a `web_order_number` field.
		Once the Web Order gets submitted to NAV, we will then save the ID generated with the record
		as reference on our DB. This will allow is to do cross referencing when a PO Number becomes
		available.
		@param   {Object}  parameters  Parameter object containing all sale data required to create and submit a sale on the database.
		@example <caption>Fields that aren't necessary from the front-end or need further clarification are:</caption>
		{
			web_order_number: null,	// May not be known from the front-end
			po_number: null,					// Will not be available from the front-end
			status: "submitted",			// We can set this from the back-end. No need for the front-end to do this.
			// This can be set from the back-end. Payment info will only be available in the back end.
			payment: {
				paid: false,
				payment_method: "po",
				CCInfo: "((VISA) xxxxx-xxxxx-9591)",
				CCStatus: "",
				CCAuthCode: "",
				CCAuthDate: "",
				CCSettleDate: "",
				CCResponse: ""
			}
		}
		@example <caption>Example Usage of the Parameters Object</caption>
		{
		   user_id: 123,
		   dealer_id: 1234,
		   salesrep_id: 853,
		   tax_amount: 20.87,
		   customer_id: "DISCOUNTTIRE",
		   customer_info: {
		       customer_name: "John Doe",
		       company_name: "MIRUM SHOPPER",
		       phone: 8185554545,
		       email: john.doe@email.com
		   },
		   customer_billing_info: {
		       customer_name: customer_name,
		       company_name: "MIRUM SHOPPER",
		       phone: 8185554545,
		       email: john.doe@email.com,
		       address_1: "123 Some St",
		       address_2: "",
		       city: "Los Angeles",
		       state: "CA",
		       zip: "91605",
		       country: "us"
		   },
		   ship_to_info: {
		       store_number: 10000,
		       address_1: "123 Some Store St",
		       address_2: "",
		       city: "Culver City",
		       state: "CA",
		       zip: "91604",
		       country: "us"
		   },
		   freight_total: 45.56,
		   subtotal_amount: 678.90,
		   total_discount_amount: 8.89,
		   total_invoice_amount: 3000.00
		}
		@param {Object} options 
		Additional Options that may be defined later in dev.
		Currently one of the options is to confirm whether this method should use
		fake data or not. If the `mockdata` property is set to true, we will get
		all mock data, else use real data passed in.
		If using `mockdata` but the `parameters` already contains half the data
		only missing data will be merged into the `parameters` data.
		@example <caption>Example Usage of the Options Object</caption>
		{
			mockdata: false
		}
		@return {Object} Initially, Returns a Deferred Promise Object
	*/
	submitPurchaseOrder: function( props ) {
		var deferred = Q.defer();

		var order = props.order;
		var salesRep = props.salesRep;
		var shippingRates = props.shippingRates;
		var warehouses = props.warehouses;

		Sale.save( order ).then(function( savedSale ) {
			log( "Created Postgres Sale Record: %O", savedSale );

			var saleItems = {};
			var states = _.allKeys( warehouses );
			var shippingRatesObj = {};
			var lineItemCount = 0;

			shippingRates.forEach(function( shippingRate, index, array ) {
				shippingRatesObj[shippingRate.from] = shippingRate;
			});

			for( var r = 0; r < states.length; r++ ) {
				var state = states[r];
				var info = warehouses[state];
				var items = info.items;

				var shippingRate = shippingRatesObj[state];

				for( var t = 0; t < items.length; t++ ) {
					var item = items[t];
					var itemId = (item.item) ? item.item.id : item.id;

					lineItemCount++;
					item.lineItem = lineItemCount;
					item = __parseWarehouseSaleItem( item, state, info, shippingRate );

					if( !_.has( saleItems, itemId ) ) {
						saleItems[itemId] = [];
					}

					saleItems[itemId].push( item );
				}
			}

			log( "Parsed Sale Items to save in Postgres: %O", saleItems );

			var purchaseOrder = {
				saleItems: saleItems,
				salesRep: salesRep,
				savedSale: savedSale,
				savedSaleItems: null
			};

			__saveSaleItems( savedSale, saleItems ).then(function( savedSaleItems ) {

				purchaseOrder.savedSaleItems = savedSaleItems;

				deferred.resolve( purchaseOrder );
			}).fail(function( error ) {
				deferred.reject( error );
			}).done();
		}).fail(function( error ) {
			deferred.reject( error );
		}).done();

		return deferred.promise;
	},
	submitStripePayment: function( props ) {
		var deferred = Q.defer();

		var poNumber = props.po_number;
		var token = props.token;
		var totals = props.totals;
		var webOrderNumber = props.web_order_number;

		var total = totals.total;
		var amount = total * 100;

		Stripe.submitPayment({
			amount: amount,
			currency: "USD",
			description: "Vision Wheel Dealer Web Order Purchase.",
			token: token
		}, {
			po_number: poNumber,
			web_order_number: webOrderNumber
		}).then(function( charge ) {
			// log( Exectimer.timeEnd( "submitStripePayment()" ) );
			deferred.resolve( charge );
		}).fail(function( error ) {
			// log( Exectimer.timeEnd( "submitStripePayment()" ) );
			deferred.reject( error );
		}).done();

		return deferred.promise;
	},
	updateUserCart: function( props ) {
		var deferred = Q.defer();

		var user = props.user;
		var userId = user.id;
		var userCart = user.cart;

		User.update({
			id: userId,
			cart: userCart
		}).then(function( user ) {
			deferred.resolve( user );
		}).fail(function( error ) {
			deferred.reject( error );
		}).done();

		return deferred.promise;
	}
};

function __findSale( parameters, options ) {
	var deferred = Q.defer();
	options = options || {};
	parameters = parameters || {};

	var that = this;
	Sale.findOne( parameters ).then(function( sale ) {
		/**
		 * This can be an options where if `options.noItems` is set to true,
		 * then we exclude the fetching of the Items associated with the Sale.
		 * One would do this if, they just want the sale data but not the full
		 * breakdown including the items in the sale.
		 *
		 * @param   {Boolean}  options.noItems  If to include the Sale's Items or not.
		 *
		 * @return  {Object}                    Resolve the promise with the Sale Object found.
		 */
		if( options.noItems ) {
			return deferred.resolve( sale );
		}
		__findSaleItems( sale ).then(function( response ) {
			deferred.resolve( response );
		}).fail(function( error ) {
			deferred.reject( error );
		}).done();
	}).fail(function( error ) {
		deferred.reject( error );
	}).done();
	return deferred.promise;
}

function __findSaleItems( sale ) {
	var deferred = Q.defer();

	sale.sale_items = {};
	/** Find `sale_items` associated with this Sale's ID. */
	SaleItem.find({ sale_id: sale.id }).then(function( saleItems ) {
		/**
		 * If we found `sale_items` with the associated `sale.id`, we
		 * append them to the `sale.sale_items` object as hashes. Else
		 * we just keep it as an empty object indicating no Items.
		 *
		 * However, empty items should never happen. That means there is a
		 * bug somewhere. A sale can not occur without items.
		 */
		if( saleItems.length ) {
			for( var f = 0; f < saleItems.length; f++ ) {
				var saleItem = saleItems[f];
				var saleItemId = saleItem.id;
				delete saleItem.id;
				sale.sale_items[saleItemId] = _.extend( {}, saleItem );
			}
			deferred.resolve( sale );
		}
		else {
			deferred.resolve( sale );
		}
	}).fail(function( error ) {
	    deferred.reject( error );
	}).done();

	return deferred.promise;
}

function __fixSize( size ) {
	var sizeSplit = null;
	if( size.indexOf( "X" ) > -1) {
		sizeSplit = size.split( "X" );
		size = sizeSplit[0];
	}
	if( size.indexOf( "M" ) > -1) {
		sizeSplit = size.split( "M" );
		size = sizeSplit[0];
	}
	if( size.indexOf( "/" ) > -1) {
		sizeSplit = size.split( "/" );
		size = sizeSplit[0];
	}
	size = parseInt( size );
	if( isNaN( size ) ) {
		size = null;
	}
	return size;
}

function __getShippingRates( parameters ) {
	var deferred = Q.defer();

	var shipping = parameters.shipping;
	var postalcode = shipping.postalcode;
	var user = parameters.user;
	var userCart = user.cart;
	var userCartItems = userCart.items;
	var warehouses = parameters.warehouses;

	var shippingCalculatorBody = [];
	var excludeShippingCalculatorBody = [];
	userCartItems.forEach(function( item, index, array ) {
		var locations = item.locations;
		for( var a = 0; a < locations.length; a++ ) {
			var location = locations[a];
			var state = location.key;
			var toExclude = false;
			var shipCalcItem = {
				price: item.price,
				qty: location.quantity,
				size: item.specification.size,
				type: item.type
			};
			// TODO: may not work
			if( state === "AB" || state === "ON" ) {
				continue;
			}
			// TODO: should throw error
			if( !shipCalcItem.size ) {
				continue;
			}
			shipCalcItem.size = __fixSize( shipCalcItem.size );
			if( warehouses[state].method === "pickup" ) {
				toExclude = true;
			}
			if( toExclude ) {
				var idx = _.findIndex( excludeShippingCalculatorBody, {
					from: state
				});
				if( excludeShippingCalculatorBody.length && idx > -1 ) {
					var existingCalculationOpt = excludeShippingCalculatorBody[idx];
					existingCalculationOpt.items.push( shipCalcItem );
				}
				else {
					var shipBodyCalc = {
						from: state,
						to: postalcode,
						items: [shipCalcItem],
						shippingtotal: 0
					};
					excludeShippingCalculatorBody.push( shipBodyCalc );
				}
			}
			else {
				var idx = _.findIndex( shippingCalculatorBody, {
					from: state
				});
				if( shippingCalculatorBody.length && idx > -1 ) {
					var existingCalculationOpt = shippingCalculatorBody[idx];
					existingCalculationOpt.items.push( shipCalcItem );
				}
				else {
					var shipBodyCalc = {
						from: state,
						to: postalcode,
						items: [shipCalcItem]
					};
					shippingCalculatorBody.push( shipBodyCalc );
				}
			}
		}
	});
	if( !_.isEmpty( shippingCalculatorBody ) ) {
		ShippingCalculator.request( shippingCalculatorBody ).then(function( shippingCalculations ) {
			var fromStates = _.allKeys( shippingCalculations );
			for( var f = 0; f < fromStates.length; f++ ) {
				var fromState = fromStates[f];
				for( var s = 0; s < shippingCalculatorBody.length; s++ ) {
					var submittedBody = shippingCalculatorBody[s];
					var fromStateCalculation = shippingCalculations[fromState];
					var fromStateShippingTotal = fromStateCalculation.totalCost;
					// TODO: should throw error
					if( submittedBody.from !== fromState ) {
						continue;
					}
					submittedBody.shippingtotal = fromStateShippingTotal;
				}
			}
			if( !_.isEmpty( excludeShippingCalculatorBody ) ) {
				shippingCalculatorBody = _.union( shippingCalculatorBody, excludeShippingCalculatorBody );
			}
			shippingCalculatorBody.forEach(function( body, index, array ) {
				var subtotal = 0;
				body.items.forEach(function( item, index, array ) {
					subtotal += parseFloat( item.price ) * item.qty;
				});
				body.subtotal = subtotal;
			});
			deferred.resolve( shippingCalculatorBody );
		}).fail(function( error ) {
			deferred.reject( error );
		}).done();
	}
	else {
		var resolvingBodObj = {};
		if( !_.isEmpty( excludeShippingCalculatorBody ) ) {
			excludeShippingCalculatorBody.forEach(function( excludeBody, index, array ) {
				var subtotal = 0;
				excludeBody.items.forEach(function( item, index, array ) {
					subtotal += parseFloat( item.price ) * item.qty;
				});
				excludeBody.subtotal = subtotal;
			});
			resolvingBodObj = excludeShippingCalculatorBody;
		}
		deferred.resolve( resolvingBodObj );
	}

	return deferred.promise;
}

function __parseDecimalPricing( pricing ) {
	if( typeof pricing !== "string" ) {
		pricing = pricing.toString();
	}
	return parseFloat( Math.round( pricing * 100 ) / 100 ).toFixed( 2 );
}

/**
 * @private
 * Parses the info to create a `sale_item` with the required postgres
 * schema.
 * @param   {[type]}  item          [description]
 * @param   {[type]}  state         [description]
 * @param   {[type]}  stateDetails  [description]
 * @return  {[type]}                [description]
 */
function __parseWarehouseSaleItem( item, state, info, shippingRate ) {
	var stateDetails = info.details;
	var qty = item.quantity;
	var lineItem = item.lineItem;
	if( item.item ) {
		item = item.item;
	}

	var unit_price = item.price;
	var total_line_amount = parseFloat( unit_price ) * qty;
	total_line_amount = __parseDecimalPricing( total_line_amount );

	var taxRate = shippingRate ? shippingRate.taxrate : 0;
	var taxAmount = ( taxRate / 100 ) * unit_price;
	taxAmount = __parseDecimalPricing( taxAmount );

	var shipping_agent = "UPS";
	var shipping_method = info.method;
	var eship_agent_service_code = "GROUND";

	if( !_.isEmpty( info.option ) ) {
		if( info.option === "2 day" ) {
			info.option = "2nd day";
		}
		eship_agent_service_code = info.option;
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

	var item_description = {
		product_name: item.specification.model,
		size: item.specification.size,
		finish: item.specification.finish,
		line_item_number: lineItem
	};
	/** @type {String} Set the Item's Image. This shouldbe only one image. */
	if( item.image && item.image.list ) {
		item_description.image = item.image.list[0];
	}

	var fulfilment_location = {
		code: state,
		name: stateDetails.name,
		address: stateDetails.address,
		city: stateDetails.city,
		state: stateDetails.state,
		postal: stateDetails.postal
	};

	var shipping_options = {
		shipped: false,
		delivery_type: "commercial",
		shipping_agent: "",
		shipping_method: shipping_method,
		eship_agent_service_code: eship_agent_service_code
	};

	var sale_item = {};
	sale_item.customer_item_no = "";
	sale_item.tax_amount = taxAmount;
	sale_item.item_no = item.part_number;
	sale_item.qty = qty;
	sale_item.unit_price = unit_price;
	sale_item.total_line_amount = total_line_amount;
	sale_item.item_description = item_description;
	sale_item.fulfilment_location = fulfilment_location;
	sale_item.shipping_options = shipping_options;

	return sale_item;
}

function __saveNavRecords( publishedPO, purchaseOrder ) {
	log( "Published PO Headers" );
	log( publishedPO.header );
	log( "Published PO Lines" );
	log( publishedPO.lines );

	var savedSale = purchaseOrder.savedSale;
	var savedSaleItems = purchaseOrder.savedSaleItems;

	var updatedSaleItems = savedSaleItems.map(function( savedSaleItem ) {
		var matchingItems = publishedPO.lines.filter(function( lineItem ) {
			return lineItem["Item No_"] === savedSaleItem.item_no;
		});

		for( var d = 0; d < matchingItems.length; d++ ) {
			var matchingItem = matchingItems[d];
			if( matchingItem.Quantity !== savedSaleItem.qty ) {
				continue;
			}

			var tax_amount = savedSaleItem.tax_amount.replace( /\$/g, "" );
			tax_amount = parseFloat( tax_amount );
			if( matchingItem["Tax Amount"] !== tax_amount ) {
				continue;
			}

			var unit_price = savedSaleItem.unit_price.replace( /\$/g, "" );
			unit_price = parseFloat( unit_price );
			if( matchingItem["Unit Price"] !== unit_price ) {
				continue;
			}

			var total_line_amount = savedSaleItem.total_line_amount.replace( /\$/g, "" );
			total_line_amount = parseFloat( total_line_amount );
			if( matchingItem["Total Line Amount"] !== total_line_amount ) {
				continue;
			}

			savedSaleItem.nav_record = matchingItem;
			break;
		}

		if( savedSaleItem.applied ) {
			delete savedSaleItem.applied;
		}

		return SaleItem.update( savedSaleItem );
	});

	savedSale.nav_record = {
		headers: publishedPO.header
	};

	var promises = _.union( [Sale.update( savedSale )], updatedSaleItems );

	return Q.allSettled( promises );
}

function __saveSaleItems( savedSale, saleItems ) {
	var deferred = Q.defer();

	var promises = [];

	/** Now we iterate throughout each Item in the sale and save it onto the Database */
	for( var itemId in saleItems ) {
		if( saleItems.hasOwnProperty( itemId ) ) {
			var saleItemArr = saleItems[itemId];

			for( var y = 0; y < saleItemArr.length; y++ ) {
				var newSaleItem = saleItemArr[y];
				/** On each sale item, we associate the saved sale id and the item id. */
				newSaleItem.sale_id = savedSale.id;
				newSaleItem.item_id = parseInt( itemId );

				var promise = SaleItem.save( newSaleItem );
				promises.push( promise );
			}
		}
	}

	Q.allSettled( promises ).then(function( results ) {
		var savedSaleItems = [];
		var errorResults = [];
		var hasErrors = false;
		results.forEach(function( result ) {
			if( result.state !== "fulfilled" ) {
				hasErrors = true;
				errorResults.push( result );
			}
			else {
				savedSaleItems.push( result.value );
			}
		});
		if( hasErrors ) {
			deferred.reject( errorResults );
		}
		else {
			deferred.resolve( savedSaleItems );
		}
	}).done();

	return deferred.promise;
}
