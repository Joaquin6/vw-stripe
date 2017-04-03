var React = require( "react" );
var ReactDOM = require( "react-dom" );
var LoadingIndicator = require( "../overlay/loadingIndicator" );
var RemoveItemConfirmation = require( "../overlay/removeItemConfirmation" );
var Details = require( "./steps/details" );
var Checkout = React.createClass({
	getInitialState: function() {
		var handleCart = this.handleCart;
		var onSubmitStripe = this.onSubmitStripe;
		var props = this.props;
		var data = handleCart( props.cart );
		var cart = data.cart;
		var warehouses = data.warehouses;
		var subtotal = data.subtotal;
		return {
			cart: cart,
			step: "details",
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
						var data = handleCart( result.data );
						component.setState({
							cart: data.cart,
							subtotal: data.subtotal,
							warehouses: data.warehouses
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
	renderOverlay: function( component ) {
		var overlay = document.getElementById( "overlay" );
		var $overlay = $( overlay );
		if( !$overlay.hasClass( "toggle" ) ) {
			$( "html, body" ).addClass( "no-scroll" );
			$overlay.addClass( "toggle" );
		}
		ReactDOM.render( component, overlay );
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
		var onClickRemoveItem = this.onClickRemoveItem;
		var state = this.state;
		var steps = handleSteps( "details" );
		var render;
		switch( state.step ) {
			case "details":
				render = <Details cart={ state.cart } warehouses={ state.warehouses } onClickRemoveItem={ onClickRemoveItem } userIsPending={ true } />;
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