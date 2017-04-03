var Repository = require( "./repository" ),
		warehousesJSON = require( "config/settings/warehouses" );

class CheckoutController {
	constructor( Model ) {
		this.addToCart = this.addToCart.bind( this, Model.props );
		this.getCartDetailsAndSubtotal = this.getCartDetailsAndSubtotal.bind( this, Model.props );
		this.getCartTotals = this.getCartTotals.bind( this, Model.props );
		this.getErrors = this.getErrors.bind( this, Model.errors );
		this.getProps = this.getProps.bind( this, Model.props );
		this.removeFromCart = this.removeFromCart.bind( this, Model.props );
		this.submitPurchaseOrder = this.submitPurchaseOrder.bind( this, Model.props );
	}
	addToCart( props, parameters ) {
		var that = this;
		return new Promise(function( resolve, reject ) {
			var validation = __validateAddToCart( parameters );
			if( validation.isValid ) {
				Repository.updateUserCart( __addToCart( props, validation.parameters ) ).then(function( user ) {
					that.getCartDetailsAndSubtotal().then(function( response ) {
						resolve({
							message: "successfully updated user cart, found cart details, and calculated subtotal",
							parameters: validation.parameters,
							props: props
						});
					}).catch(function( error ) {
						reject({
							message: "successfully updated user cart, but could not find cart details, and calculate subtotal",
							parameters: validation.parameters,
							props: props
						});
					});
				}).fail(function( error ) {
					reject({
						message: "could not update user cart",
						parameters: validation.parameters,
						props: props
					});
				});
			}
			else {
				reject({
					message: "invalid parameters",
					parameters: validation.parameters,
					props: props
				});
			}
		});
	}
	getCartDetailsAndSubtotal( props ) {
		return new Promise(function( resolve, reject ) {
			Repository.findCartDetails( props ).then(function( items ) {
				Repository.getItemPricing( __parseCartDetails( props, items ) ).then(function( prices ) {

					props.user.cart.items.forEach(function( item, index, array ) {
						item.price = __parseDecimalPricing( prices[item.part_number] );
					});

					props.totals.subtotal = __parseDecimalPricing( __calculateSubtotal( items ) );

					resolve({
						message: "successfully found cart details, and calculated subtotal",
						parameters: null,
						props: props
					});
				}).fail(function( error ) {
					reject({
						message: "successfully found cart details, but could not calculate subtotal",
						parameters: null,
						props: props
					});
				});
			}).fail(function( error ) {
				reject({
					message: "could not find cart details",
					parameters: null,
					props: props
				});
			});
		});
	}
	getCartTotals( props, parameters ) {
		var that = this;
		return new Promise(function( resolve, reject ) {
			var validation = __validateCheckout( props, parameters );
			if( validation.isValid ) {
				that.getCartDetailsAndSubtotal().then(function( response ) {
					Repository.getShippingRates( props ).then(function( shippingRates ) {

						props.shippingRates = shippingRates;

						if( shippingRates.length ) {
							var shippingtotal = 0;
							shippingRates.forEach(function( shippingRate, index, array ) {
								shippingtotal += shippingRate.shippingtotal;
							});

							props.totals.shippingtotal = __parseDecimalPricing( shippingtotal );

							Repository.getTaxRate( props ).then(function( taxRate ) {
								var rate = taxRate.rate;
								var taxtotal = 0;
								props.shippingRates.forEach(function( shippingRate, index, array ) {
									shippingRate.taxrate = rate;
									shippingRate.taxtotal = (rate / 100) * (shippingRate.shippingtotal + shippingRate.subtotal);
									taxtotal += shippingRate.taxtotal;
								});

								props.canPay = true;

								props.taxRate = taxRate;

								props.totals.taxtotal = __parseDecimalPricing( taxtotal );

								props.totals.total = __parseDecimalPricing( parseFloat( props.totals.subtotal ) + parseFloat( props.totals.shippingtotal ) + parseFloat( props.totals.taxtotal ) );

								resolve({
									message: "successfully calculated cart totals",
									parameters: validation.parameters,
									props: props
								});
							}).catch(function( error ) {
								reject({
									message: "could not calculate tax total",
									parameters: validation.parameters,
									props: props
								});
							});
						}
						else {
							// canPay === false
							resolve({
								message: "successfully calculated cart totals",
								parameters: validation.parameters,
								props: props
							});
						}
					}).catch(function( error ) {
						reject({
							message: "could not calculate shipping total",
							parameters: validation.parameters,
							props: props
						});
					});
				}).catch(function( error ) {
					reject({
						message: "could not find cart details, and calculate subtotal",
						parameters: validation.parameters,
						props: props
					});
				});
			}
			else {
				reject({
					message: "invalid parameters",
					parameters: validation.parameters,
					props: props
				});
			}
		});
	}
	getErrors( errors ) {
		return errors;
	}
	getProps( props ) {
		return props;
	}
	removeFromCart( props, parameters ) {
		var that = this;
		return new Promise(function( resolve, reject ) {
			var validation = __validateRemoveFromCart( parameters );
			if( validation.isValid ) {
				Repository.updateUserCart( __removeFromCart( props, validation.parameters ) ).then(function( user ) {
					that.getCartDetailsAndSubtotal().then(function( response ) {
						resolve({
							message: "successfully removed from cart, retreived cart details, and calculated subtotal",
							parameters: validation.parameters,
							props: props
						});
					}).catch(function( error ) {
						reject({
							message: "successfully updated user cart, but could not find cart details, and calculate subtotal",
							parameters: validation.parameters,
							props: props
						});
					});
				}).catch(function( error ) {
					reject({
						message: "could not update user cart",
						parameters: validation.parameters,
						props: props
					});
				});
			}
			else {
				reject({
					message: "invalid parameters", 
					parameters: validation.parameters,
					props: props
				});
			}
		});
	}
	submitPurchaseOrder( props, parameters ) {
		var that = this;
		return new Promise(function( resolve, reject ) {
			that.getCartTotals( parameters ).then(function( response ) {
				var validatedParameters = response.parameters;

				Repository.findSalesRep( props ).then(function( salesRepObj ) {

					props.salesRep = salesRepObj;

					Repository.generateWebOrderNumber( props ).then(function( webOrderNumbers ) {

						props.web_order_number = webOrderNumbers["New Generated Web Order Number"];

						props.order = __parseOrder( props );

						if( props.token ) {
							Repository.submitStripePayment( props ).then(function( charge ) {

								props.order = __updateOrderByCharge( props, charge );

								__submitPurchaseOrder( props ).then(function( savedRecords ) {
									resolve({
										message: "successfully submitted purchase order",
										parameters: validatedParameters,
										props: props
									});
								}).catch(function( error ) {
									reject({
										message: "successfully calculated cart totals, but could not submit purchase order",
										parameters: validatedParameters,
										props: props
									});
								});
							}).catch(function( error ) {
								reject({
									message: "successfully calculated cart totals, but could not submit stripe payment",
									parameters: validatedParameters,
									props: props
								});
							});
						}
						else {
							__submitPurchaseOrder( props ).then(function( savedRecords ) {
								resolve({
									message: "successfully submitted purchase order",
									parameters: validatedParameters,
									props: props
								});
							}).catch(function( error ) {
								reject({
									message: "successfully calculated cart totals, but could not submit purchase order",
									parameters: validatedParameters,
									props: props
								});
							});
						}
					}).catch(function( error ) {
						reject({
							message: "successfully calculated cart totals, but could not generate web order number",
							parameters: validatedParameters,
							props: props
						});
					});
				}).catch(function( error ) {
					reject({
						message: "could not find sales rep",
						parameters: validatedParameters,
						props: props
					});
				});
			}).catch(function( error ) {
				reject({
					message: "could not get cart totals",
					parameters: validatedParameters,
					props: props
				});
			});
		});
	}
}

module.exports = CheckoutController;

function __addToCart( props, parameters ) {
	if( !props.user.cart.items[parameters.id] ) {

		props.user.cart.items[parameters.id] = {};

	}
	for( var state in parameters.locations ) {
		var location = parameters.locations[state];
		var quantity = location.quantity;
		if( props.user.cart.items[parameters.id][state] ) {

			props.user.cart.items[parameters.id][state] += quantity;

		}
		else {

			props.user.cart.items[parameters.id][state] = quantity;

		}
	}
	return props;
}

function __calculateSubtotal( items ) {
	var subtotal = 0;
	items.forEach(function( item, index, array ) {
		item.locations.forEach(function( location, index, array ) {
			var quantity = location.quantity;
			if( quantity && !isNaN( quantity ) ) {
				subtotal += parseFloat( item.price ) * parseInt( quantity );
			}
		});
	});
	return subtotal;
}

function __clearCart( props ) {
	props.user.cart.items = {};
	return props;
}

function __parseCartDetails( props, items ) {
	var warehouses = {};
	items.forEach(function( item, index, array ) {
		var locations = [];
		for( var state in props.user.cart.items[item.id] ) {
			var quantity = props.user.cart.items[item.id][state];
			if( quantity ) {
				var warehouse = props.warehouses ? props.warehouses[state] : null;
				if( !warehouses[state] ) {
					warehouses[state] = {
						details: warehousesJSON[state],
						items: [],
						method: warehouse ? warehouse.method : "",
						option: warehouse ? warehouse.option : ""
					};
				}
				warehouses[state].items.push({
					item: item,
					quantity: quantity
				});
				locations.push({
					key: state,
					quantity: quantity
				});
			}
		}
		item.locations = locations;
	});

	props.user.cart.items = items;

	props.warehouses = warehouses;

	return props;
}

function __parseDecimalPricing( pricing ) {
	if( typeof pricing !== "string" ) {
		pricing = pricing.toString();
	}
	return parseFloat( Math.round( pricing * 100 ) / 100 ).toFixed( 2 );
}

function __parseOrder( props ) {
	var canPay = props.canPay;
	var poNumber = props.po_number;
	var salesRep = props.salesRep;
	var shipping = props.shipping;
	var shippingRates = props.shippingRates;
	var totals = props.totals;
	var user = props.user;
	var warehouses = props.warehouses;
	var webOrderNumber = props.web_order_number;

	// var created = new Date();
	var customerInfo = {
		customer_name: shipping.first_name + " " + shipping.last_name,
		company_name: shipping.company,
		phone: user.phone_number,
		email: user.email
	};
	var shippingAddress = {
		address_1: shipping.address_1,
		address_2: shipping.address_2,
		city: shipping.city,
		state: shipping.state,
		zip: shipping.postalcode,
		country: shipping.country
	};
	var payment = {
		paid: false,
		payable: canPay,
		payment_method: "CHARGE",
		CCInfo: "",
		CCStatus: "",
		CCAuthCode: "",
		CCAuthDate: "",
		CCSettleDate: "",
		CCResponse: ""
	};
	var shipToInfo = {
		store_number: shipping.store_number
	};
	var customerBillingInfo = {};
	for( var key in customerInfo ) {
		customerBillingInfo[key] = customerInfo[key];
		shipToInfo[key] = customerInfo[key];
	}
	for( var key in shippingAddress ) {
		customerBillingInfo[key] = shippingAddress[key];
		shipToInfo[key] = shippingAddress[key];
	}

	var order = {
		// created: created,
		customer_billing_info: customerBillingInfo,
		customer_id: user.dealer ? user.dealer.nav_customer_id : null,
		customer_info: customerInfo,
		dealer_id: user.dealer_id || null,
		freight_total: totals.shippingtotal,
		nav_record: null,
		payment: payment,
		po_number: poNumber,
		salesrep_id: user.sales_rep,
		ship_to_info: shipToInfo,
		status: "submitted",
		subtotal_amount: totals.subtotal,
		tax_amount: totals.taxtotal,
		total_discount_amount: totals.discounttotal,
		total_invoice_amount: totals.total,
		// updated: created,
		user_id: user.id,
		web_order_number: webOrderNumber
	};

	return order;
}

function __removeFromCart( props, parameters ) {
	if( props.user.cart.items[parameters.id] ) {
		if( props.user.cart.items[parameters.id][parameters.location] ) {
			var states = [];
			for( var state in props.user.cart.items[parameters.id] ) {
				states.push( state );
			}
			if( states.length === 1 ) {

				delete props.user.cart.items[parameters.id];

			}
			else {

				delete props.user.cart.items[parameters.id][parameters.location];

			}
		}
	}
	return props;
}

function __submitPurchaseOrder( props ) {
	return new Promise(function( resolve, reject ) {
		Repository.submitPurchaseOrder( props ).then(function( purchaseOrder ) {

			props.purchaseOrder = purchaseOrder;

			Repository.updateUserCart( __clearCart( props ) ).then(function( user ) {
				Repository.sendOrderEmail( props.purchaseOrder.savedSale.id, {
					action: "initOrder"
				});
				Repository.publishPurchaseOrder( props ).then(function( savedRecords ) {
					resolve( savedRecords );
				}).catch(function( error ) {
					reject({
						message: "could not publish purchase order",
						// parameters: validatedParameters,
						props: props
					});
				});
			}).catch(function( error ) {
				reject({
					message: "could not update user cart",
					// parameters: validatedParameters,
					props: props
				});
			});
		}).catch(function( error ) {
			reject({
				message: "could not submit purchase order",
				// parameters: validatedParameters,
				props: props
			});
		});
	});
}

function __updateOrderByCharge( props, charge ) {
	var order = props.order;

	var payment = order.payment;

	/** Change the Payment Method to 'CREDIT' */
	payment.payment_method = "CREDIT CAR";

	/** Apply all necessary CC Details. */
	payment.CCStatus = 0;
	payment.CCAuthCode = charge.id;
	payment.CCAuthDate = charge.created;
	payment.CCSettleDate = "";

	/** Check if the Network Authorized the Transaction. */
	if( charge.outcome.type !== "authorized" ) {
		// log( "Stripe Charge Outcome NOT Authorized" );
		// log( charge.outcome );
		payment.CCStatus = 2;
	}
	else if( charge.outcome.type === "authorized" ) {
		payment.CCStatus = 1;
	}

	/** Set the flag that this has been paid */
	if( charge.paid ) {
		payment.paid = charge.paid;
	}

	/** Now assign the CCInfo with the ccBrand and Last 4 */
	var ccBrand = charge.source.brand.toUpperCase();
	var ccLast4 = charge.source.last4;
	payment.CCInfo = "((" + ccBrand + ") xxxxx-xxxxx-" + ccLast4 + ")";

	// log( "Successfully Updated Order Payment with New Stripe Charge" );
	// log( payment );

	return order;
}

function __validateAddToCart( parameters ) {
	var errors = [];
	var isValid = false;
	var itemId, itemLocations;
	if( parameters.id && !isNaN( parameters.id ) && parameters.locations && typeof parameters.locations === "string" ) {
		try {
			itemId = parseInt( parameters.id );
			itemLocations = JSON.parse( parameters.locations );
			for( var state in itemLocations ) {
				var location = itemLocations[state];
				var quantity = location.quantity;
				if( !isNaN( quantity ) ) {
					location.quantity = parseInt( quantity );
				}
				else {
					errors.push( `itemLocations["${ state }"]: quantity is not a number;` );
				}
			}
		}
		catch( error ) {
			errors.push( error );
		}
		if( itemId && itemLocations ) {
			isValid = true;
		}
	}
	else {
		errors.push( "invalid or missing parameters" );
	}
	return {
		errors: isValid ? false : errors,
		isValid: isValid,
		parameters: isValid ? {
			id: itemId,
			locations: itemLocations
		} : parameters
	};
}

function __validateCheckout( props, parameters ) {
	var user = props.user;
	var errors = [];
	var isValid = false;
	var itemIds = [];
	for( var itemId in user.cart.items ) {
		if( !isNaN( itemId ) ) {
			itemIds.push( itemId );
		}
	}
	if( itemIds.length ) {
		if( parameters.po_number && typeof parameters.po_number === "string" ) {
			props.po_number = parameters.po_number;
		}
		else {
			errors.push( "parameters.po_number is invalid" );
		}
		try {
			props.shipping = parameters.shipping && typeof parameters.shipping === "string" ? JSON.parse( parameters.shipping ) : null;
		}
		catch( error ) {
			errors.push( "parameters.shipping is invalid" );
		}
		try {
			props.token = parameters.token && typeof parameters.token === "string" ? JSON.parse( parameters.token ) : null;
		}
		catch( error ) {
			errors.push( "parameters.token is invalid" );
		}
		try {
			props.warehouses = parameters.warehouses && typeof parameters.warehouses === "string" ? JSON.parse( parameters.warehouses ) : null;
		}
		catch( error ) {
			errors.push( "parameters.warehouses is invalid" );
		}
		if( !errors.length ) {
			isValid = true;
		}
	}
	else {
		errors.push( "user.cart has no items" );
	}
	return {
		errors: isValid ? false : errors,
		isValid: isValid,
		parameters: parameters
	};
}

function __validateRemoveFromCart( parameters ) {
	var errors = [];
	var isValid = false;
	var itemId, itemLocation;
	if( parameters.id && !isNaN( parameters.id ) && parameters.location && typeof parameters.location === "string" ) {
		itemId = parseInt( parameters.id );
		itemLocation = parameters.location;
		isValid = true;
	}
	else {
		errors.push( "invalid or missing parameters" );
	}
	return {
		errors: isValid ? false : errors,
		isValid: isValid,
		parameters: isValid ? {
			id: itemId,
			location: itemLocation
		} : parameters
	};
}
