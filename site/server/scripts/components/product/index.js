var React = require( "react" );
var ReactDOM = require( "react-dom" );
var AddToCartResult = require( "../overlay/addToCartResult" );
var LoadingIndicator = require( "../overlay/loadingIndicator" );
var AccessorySelector = require( "./accessory" );
var TireSelector = require( "./tire" );
var WheelSelector = require( "./wheel" );
var ItemSelector = React.createClass({
	getInitialState: function() {
		return {

		};
	},
	onClickAddToCart: function( itemId, locations ) {
		var props = this.props;
		var overlay = document.getElementById( "overlay" );
		var $overlay = $( overlay );
		var onClickClose = function( event ) {
			$overlay.removeClass( "toggle" );
			$( "html, body" ).removeClass( "no-scroll" );
			ReactDOM.unmountComponentAtNode( overlay );
		};
		var result, error;
		$.ajax({
			method: "POST",
			url: "/cart",
			dataType: "json",
			data: {
				id: itemId,
				locations: JSON.stringify( locations )
			},
			success: function( response ) {
				result = response;
			},
			error: function( response ) {
				result = response;
			},
			complete: function() {
				console.log( result );
				ReactDOM.render( <AddToCartResult result={ result } warehouses={ props.warehouses } onClickClose={ onClickClose } />, overlay );
			}
		});
		$( "html, body" ).addClass( "no-scroll" );
		$overlay.addClass( "toggle" );
		ReactDOM.render( <LoadingIndicator />, overlay );
	},
	render: function() {
		var onClickAddToCart = this.onClickAddToCart;
		var props = this.props;
		var part_number = props.part_number;
		var product = props.product;
		var warehouses = props.warehouses;
		var type = product.type;
		var render;
		console.log( product );
		switch( type ) {
			case "accessory":
				render = <AccessorySelector part_number={ part_number } product={ product } warehouses={ warehouses } onClickAddToCart={ onClickAddToCart } />;
			break;
			case "tire":
				render = <TireSelector part_number={ part_number } product={ product } warehouses={ warehouses } onClickAddToCart={ onClickAddToCart } />;
			break;
			case "wheel":
				render = <WheelSelector part_number={ part_number } product={ product } warehouses={ warehouses } onClickAddToCart={ onClickAddToCart } />;
			break;
		}
		return render;
	}
});
module.exports = ItemSelector;