var React = require( "react" );
var ReactDOM = require( "react-dom" );
var LoadingIndicator = require( "../overlay/loadingIndicator" );
var RemoveItemConfirmation = require( "../overlay/removeItemConfirmation" );
var SubmitStripeError = require( "../overlay/submitStripeError" );
var SubmitPOError = require( "../overlay/submitPOError" );
var SubmitShippingError = require( "../overlay/submitShippingError" );
var Confirmation = require( "./steps/confirmation" );
var Details = require( "./steps/details" );
var Shipping = require( "./steps/shipping" );
var Success = require( "./steps/success" );
var Checkout = React.createClass({
	getInitialState: function() {
		var handleCart = this.handleCart;
		var onSubmitStripe = this.onSubmitStripe;
		var props = this.props;
		var cart = props.cart;
		var StripeKey = props.stripeKey;
		var warehouses = props.warehouses;
		var subtotal = cart.subtotal;
		var fields = [
			{
				label: "Store Number *",
				name: "store_number",
				caption: "* Please note, this field is not required. However, if you are a multi-store location customer and do not present a store number your order may be delayed."
			},
			{
				label: "First Name",
				name: "first_name"
			},
			{
				label: "Last Name",
				name: "last_name"
			},
			{
				label: "Email",
				name: "email"
			},
			{
				label: "Phone Number",
				name: "phone_number"
			},
			{
				label: "Your Company",
				name: "company"
			},
			{
				label: "Address 1",
				name: "address_1"
			},
			{
				label: "Address 2",
				name: "address_2"
			},
			{
				label: "City",
				name: "city"
			},
			{
				label: "Country",
				name: "country"
			},
			{
				label: "State",
				name: "state"
			},
			{
				label: "Postal Code",
				name: "postalcode"
			}
		];
		var shipping = {};
		var StripeCheckout = window.StripeCheckout;
		var StripeHandler = null;
		console.log( StripeCheckout );
		console.log( StripeKey );
		if( StripeCheckout && StripeKey ) {
			console.log( "if stripecheckout" );
			StripeHandler = StripeCheckout.configure({
				key: StripeKey,
				currency: "usd",
				image: "/img/checkout/VWheelLogo-Gray-01.png",
				locale: "auto",
				token: onSubmitStripe
			});
		}
		fields.forEach(function( field, index, array ) {
			shipping[field.name] = "";
			// shipping[field.name] = field.name;
		});
		console.log( props );
		return {
			canPay: false,
			cart: {
				items: cart.items
			},
			fields: fields,
			po_number: "",
			shipping: shipping,
			step: "details",
			StripeHandler: StripeHandler,
			totals: {
				shippingtotal: 0,
				subtotal: subtotal || 0,
				taxtotal: 0,
				total: 0
			},
			warehouses: warehouses
		};
	},
	handleCart: function( cart ) {
		var props = this.props;
		var warehouses = {};
		var subtotal = cart.subtotal;
		cart.items.forEach(function( item, index, array ) {
			var locations = [];
			for( var key in props.warehouses ) {
				var warehouse = props.warehouses[key];
				var quantity = item.locations[key];
				if( quantity ) {
					if( !warehouses[key] ) { warehouses[key] = { items: [], method: "", option: "", details: warehouse }; }
					warehouses[key].items.push({
						item: item,
						quantity: quantity
					});
					locations.push({
						key: key,
						quantity: quantity
					});
				}
			}
			item.locations = locations;
		});
		return {
			cart: cart,
			subtotal: subtotal,
			warehouses: warehouses
		};
	},
	handleSteps: function( step ) {
		var classNameDetails = (step === "details") ? "list-item step active" : "list-item step";
		var classNameShipping = (step === "shipping") ? "list-item step active" : "list-item step";
		var classNameConfirmation = (step === "confirmation") ? "list-item step active" : "list-item step";
		return <div className="steps">
			<ul className="list">
				<li className={ classNameDetails }>
					<span className="label">Products</span>
					<span className="underline"></span>
				</li>
				<li className={ classNameShipping }>
					<span className="label">Shipping</span>
					<span className="underline"></span>
				</li>
				<li className={ classNameConfirmation }>
					<span className="label">Confirmation</span>
					<span className="underline"></span>
				</li>
			</ul>
		</div>;
	},
	onChangePONumberField: function( event ) {
		var target = event.target;
		var value = target.value;
		var $target = $( target );
		var po_number;
		if( value && value.trim() !== "" && $target.hasClass( "error" ) ) {
			$target.removeClass( "error" );
		}
		po_number = value && value.trim() !== "" ? value : "";
		this.setState({
			po_number: po_number
		});
	},
	onChangeShippingField: function( event ) {
		var state = this.state;
		var shipping = state.shipping;
		var target = event.target;
		var value = target.value;
		var name = target.getAttribute( "name" );
		var $target = $( target );
		if( value && $target.hasClass( "error" ) ) {
			$target.removeClass( "error" );
		}
		shipping[name] = value;
		this.setState({
			shipping: shipping
		});
	},
	onClickPay: function( event ) {
		var state = this.state;
		var StripeHandler = state.StripeHandler;
		StripeHandler.open({
			name: "Vision Wheel, Inc.",
			description: "Est. 1976 Custom Wheel Manufacturer",
			amount: state.totals.total * 100
		});
	},
	onClickRemoveItem: function( itemId, location ) {
		var component = this;
		var handleCart = this.handleCart;
		var renderOverlay = this.renderOverlay;
		var unmountOverlay = this.unmountOverlay;
		var onClickSubmit = function( event ) {
			var result, error;
			$.ajax({
				method: "POST",
				url: `/cart/${ itemId }?remove=true`,
				dataType: "json",
				data: {
					location: location
				},
				success: function( response ) {
					result = response;
				},
				error: function( response ) {
					error = response;
				},
				complete: function() {
					if( !error ) {
						console.log( "result" );
						console.log( result );
						var totals = component.state.totals;
						totals.subtotal = result.subtotal;
						component.setState({
							cart: result.cart,
							totals: totals,
							warehouses: result.warehouses
						}, unmountOverlay );
					}
					else {
						console.log( "error" );
						console.log( error );
					}
				}
			});
			renderOverlay( <LoadingIndicator /> );
		};
		renderOverlay( <RemoveItemConfirmation onClickClose={ unmountOverlay } onClickSubmit={ onClickSubmit } /> );
	},
	onClickShippingMethod: function( key, value, option ) {
		var state = this.state;
		var warehouses = state.warehouses;
		var shipping = document.querySelectorAll( ".shipping" )[0];
		var warehouse = shipping.querySelectorAll( `.warehouse[name=${ key }]` )[0];
		var $warehouse = $( warehouse );
		if( $warehouse.hasClass( "error" ) ) {
			$warehouse.removeClass( "error" );
		}
		warehouses[key].method = value;
		warehouses[key].option = option || "";
		this.setState({
			warehouses: warehouses
		});
	},
	onSubmit: function( event ) {
		var onSubmit = this.onSubmit;
		var renderOverlay = this.renderOverlay;
		var setStep = this.setStep;
		var unmountOverlay = this.unmountOverlay;
		var state = this.state;
		var result, error;
		// var warehouses = __parseWarehouses(state);
		console.log( state.warehouses );
		console.log( state.shipping );
		console.log( state.totals );
		// still using frontend for cart instead of retreiving data on DB query
		$.ajax({
			method: "POST",
			url: "/checkout",
			dataType: "json",
			data: {
				po_number: state.po_number,
				shipping: JSON.stringify( state.shipping ),
				// totals: JSON.stringify( state.totals ),
				warehouses: JSON.stringify( state.warehouses )
			},
			success: function( response ) {
				result = response;
			},
			error: function( response ) {
				error = response;
			},
			complete: function() {
				if( !error ) {
					console.log( result );
					setStep( "success" );
					unmountOverlay();
				}
				else {
					console.log( error );
					renderOverlay( <SubmitPOError error={ error.responseJSON } onClickRetry={ onSubmit } onClickClose={ unmountOverlay } /> );
				}
			}
		});
		renderOverlay( <LoadingIndicator /> );
	},
	onSubmitShipping: function( event ) {
		var onSubmitShipping = this.onSubmitShipping;
		var onSubmitShippingFieldError = this.onSubmitShippingFieldError;
		var onSubmitShippingWarehouseError = this.onSubmitShippingWarehouseError;
		var renderOverlay = this.renderOverlay;
		var setStep = this.setStep;
		var unmountOverlay = this.unmountOverlay;
		var state = this.state;
		var warehouses = __parseWarehouses(state);
		var emptyFields = [];
		var emptyWarehouses = [];
		var hasFieldError, hasWarehouseError;
		for( var key in state.shipping ) {
			var field = state.shipping[key];
			if( key !== "store_number" && key !== "address_2" ) {
				if( field ) {
					console.log( `${ key }: ${ field }` );
				}
				else {
					hasFieldError = true;
					emptyFields.push( key );
				}
			}
		}
		for( var key in warehouses ) {
			var warehouse = warehouses[key];
			if( warehouse.method ) {
				console.log( `${ key }: ${ warehouse.method }` );
			}
			else {
				hasWarehouseError = true;
				emptyWarehouses.push( key );
			}
		}
		if( !state.po_number ) {
			hasFieldError = true;
			emptyFields.push( "po_number" );
		}
		if( !hasFieldError && !hasWarehouseError ) {
			var result, error;
			console.log( state.totals );
			$.ajax({
				method: "POST",
				url: "/checkout/totals",
				dataType: "json",
				data: {
					// postalcode: state.shipping.postalcode,
					po_number: state.po_number,
					shipping: JSON.stringify( state.shipping ),
					// totals: JSON.stringify( state.totals ),
					warehouses: JSON.stringify( warehouses )
				},
				success: function( response ) {
					result = response;
				},
				error: function( response ) {
					error = response;
				},
				complete: function() {
					if( !error ) {
						console.log( result );
						setStep( "confirmation", result );
						unmountOverlay();
					}
					else {
						console.log( error );
						renderOverlay( <SubmitShippingError error={ error.responseJSON } onClickRetry={ onSubmitShipping } onClickClose={ unmountOverlay } /> );
					}
				}
			});
			renderOverlay( <LoadingIndicator /> );
		}
		else {
			if( hasFieldError ) {
				onSubmitShippingFieldError( emptyFields );
			}
			if( hasWarehouseError ) {
				onSubmitShippingWarehouseError( emptyWarehouses );
			}
		}
	},
	onSubmitShippingFieldError: function( emptyFields ) {
		console.log( "onSubmitShippingFieldError" );
		console.log( emptyFields );
		var shipping = document.querySelectorAll( ".shipping" )[0];
		emptyFields.forEach(function( name, index, array ) {
			var input = shipping.querySelectorAll( `.field[name=${ name }]` )[0];
			var $input = $( input );
			$input.addClass( "error" );
		});
	},
	onSubmitShippingWarehouseError: function( emptyWarehouses ) {
		console.log( "onSubmitShippingWarehouseError" );
		console.log( emptyWarehouses );
		var shipping = document.querySelectorAll( ".shipping" )[0];
		emptyWarehouses.forEach(function( name, index, array ) {
			var button = shipping.querySelectorAll( `.warehouse[name=${ name }]` )[0];
			var $button = $( button );
			$button.addClass( "error" );
		});
	},
	onSubmitStripe: function( token ) {
		// You can access the token ID with `token.id`.
		// Get the token ID to your server-side code for use.
		console.log( token );
		var onSubmit = this.onSubmit;
		var onSubmitStripe = this.onSubmitStripe.bind( this, token );
		var renderOverlay = this.renderOverlay;
		var setStep = this.setStep;
		var unmountOverlay = this.unmountOverlay;
		var state = this.state;
		var result, error;
		console.log( state.totals.total );
		console.log( state.totals );

		// Code below taken from `onSubmit`.
		// Even on Stripe Transactions, we send the shipping and warehouse data.
		// var warehouses = __parseWarehouses(state);
		console.log( state.warehouses );
		console.log( state.shipping );

		$.ajax({
			method: "POST",
			url: "/checkout",
			dataType: "json",
			data: {
				po_number: state.po_number,
				token: JSON.stringify( token ),
				// totals: JSON.stringify( state.totals ),
				shipping: JSON.stringify( state.shipping ),
				warehouses: JSON.stringify( state.warehouses )
			},
			success: function( response ) {
				result = response;
			},
			error: function( response ) {
				error = response;
			},
			complete: function() {
				if( !error ) {
					console.log( result );
					setStep( "success" );
					unmountOverlay();
				}
				else {
					console.log( error );
					var onClickClose = function() {
						setStep( "confirmation", error.responseJSON.data, true );
						unmountOverlay();
					};
					renderOverlay( <SubmitStripeError error={ error.responseJSON } onClickRetry={ onSubmitStripe } onClickSubmit={ onSubmit } onClickClose={ onClickClose } /> );
				}
			}
		});
		renderOverlay( <LoadingIndicator /> );
	},
	renderOverlay: function( component ) {
		var overlay = document.getElementById( "overlay" );
		var $overlay = $( overlay );
		if( !$overlay.hasClass( "toggle" ) ) {
			$( "html, body" ).addClass( "no-scroll" );
			$overlay.addClass( "toggle" );
		}
		ReactDOM.render( component, overlay );
	},
	scrollTop: function( selector, offset ) {
		var $header = $( "header.primary" );
		var $selector = $( selector );
		offset = offset || 0;
		$( "html, body" ).animate({
			scrollTop: 0
		}, 300 );
	},
	setStep: function( step, data, noScroll ) {
		var scrollTop = this.scrollTop;
		var setState = this.setState.bind( this );
		var scroll = function() {
			if( !noScroll ) {
				scrollTop();
			}
		};
		if( step === "confirmation" ) {
			console.log( data );
			setState({
				canPay: data.canPay,
				step: step,
				totals: data.totals
			}, function() {
				scroll();
			});
		}
		else {
			setState({
				step: step
			}, function() {
				scroll();
			});
		}
	},
	unmountOverlay: function() {
		var overlay = document.getElementById( "overlay" );
		var $overlay = $( overlay );
		if( $overlay.hasClass( "toggle" ) ) {
			$overlay.removeClass( "toggle" );
			$( "html, body" ).removeClass( "no-scroll" );
		}
		ReactDOM.unmountComponentAtNode( overlay );
	},
	render: function() {
		var handleSteps = this.handleSteps;
		var onChangePONumberField = this.onChangePONumberField;
		var onChangeShippingField = this.onChangeShippingField;
		var onClickRemoveItem = this.onClickRemoveItem;
		var onClickPay = this.onClickPay;
		var onClickShippingMethod = this.onClickShippingMethod;
		var onSubmit = this.onSubmit;
		var onSubmitShipping = this.onSubmitShipping;
		var setStep = this.setStep;
		var state = this.state;
		var steps = handleSteps( state.step );
		var render;
		switch( state.step ) {
			case "details":
				render = <Details cart={ state.cart } totals={ state.totals } warehouses={ state.warehouses } setStep={ setStep } onClickRemoveItem={ onClickRemoveItem } />;
			break;
			case "shipping":
				render = <Shipping fields={ state.fields } po_number={ state.po_number } shipping={ state.shipping } warehouses={ state.warehouses } onChangePONumberField={ onChangePONumberField } onChangeShippingField={ onChangeShippingField } onClickShippingMethod={ onClickShippingMethod } onSubmitShipping={ onSubmitShipping } />;
			break;
			case "confirmation":
				render = <Confirmation cart={ state.cart } po_number={ state.po_number } shipping={ state.shipping } warehouses={ state.warehouses } canPay={ state.canPay } totals={ state.totals } onClickPay={ onClickPay } onSubmit={ onSubmit } />;
			break;
			case "success":
				render = <Success cart={ state.cart } po_number={ state.po_number } shipping={ state.shipping } warehouses={ state.warehouses } canPay={ state.canPay } totals={ state.totals } />;
			break;
		}
		return <div id="checkout">
			{ steps }
			<div className="content">
				{ render }
			</div>
		</div>;
	}
});
module.exports = Checkout;

function __parseWarehouses(state) {
	// Since this logic runs in `onSubmit` and `onSubmitStripe`,
	// I put it in this private function.
	// "standard", "ltl", "expedited", expedited.option = "2 day" || "overnight"
	// "pickup"
	var warehouses = {};
	console.log( state.warehouses );
	for( var key in state.warehouses ) {
		var method = state.warehouses[key].method;
		var option = state.warehouses[key].option;
		if( !warehouses[key] ) {
			warehouses[key] = {};
		}
		warehouses[key].method = method;
		warehouses[key].option = option;
	}
	console.log( warehouses );
	return warehouses;
}