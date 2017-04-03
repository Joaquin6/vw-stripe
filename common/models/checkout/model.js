class CheckoutModel {
	constructor( parameters ) {
		var props = {
			appSettings: parameters.appSettings,
			canPay: false,
			order: null,
			po_number: null,
			purchaseOrder: null,
			salesRep: null,
			shipping: null,
			shippingRates: null,
			taxRate: null,
			totals: {
				discounttotal: null,
				shippingtotal: null,
				subtotal: null,
				taxtotal: null,
				total: null
			},
			token: null,
			user: parameters.user,
			warehouses: null,
			web_order_number: null
		};
		var errors = [];
		this.getErrors = this.getErrors.bind( this, errors );
		this.getProps = this.getProps.bind( this, props );
		this.pushError = this.pushError.bind( this, errors );
		this.setProps = this.setProps.bind( this, props );
	}
	getProps( props ) {
		console.log( "getProps" );
		return props;
	}
	getErrors( errors ) {
		console.log( "getErrors" );
		return errors;
	}
	pushError( errors, message ) {
		console.log( "pushError" );
		errors.push( message );
		return errors;
	}
	setProps( props, data ) {
		console.log( "setProps" );
		for( var key in data ) {
			if( props[key] ) {
				props[key] = data[key];
			}
		}
		return props;
	}
	get errors() {
		var errors = this.getErrors();
		return errors;
	}
	get props() {
		var props = this.getProps();
		return props;
	}
	set props( data ) {
		var props = this.setProps( data );
		return props;
	}
}

module.exports = CheckoutModel;
