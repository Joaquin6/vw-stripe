var React = require( "react" );
var ReactDOM = require( "react-dom" );
var common = require( "./components/common" );
var CheckoutPendingComponent = require( "./components/checkout/pending" );
require( "../styles/checkout.scss" );
(function() {
	console.log( "===== Closure =====" );
	window.addEventListener( "DOMContentLoaded", function( event ) {
		console.log( "===== DOMContentLoaded =====" );
		var main = document.getElementById( "main" );
		var props = document.getElementById( "props" );
		var cart = JSON.parse( props.getAttribute( "cart" ) );
		var warehouses = JSON.parse( props.getAttribute( "warehouses" ) );
		common();
		ReactDOM.render( <CheckoutPendingComponent cart={ cart } warehouses={ warehouses } />, main );
		console.log( "===== /DOMContentLoaded =====" );
	}, false );
	window.addEventListener( "load", function( event ) {
		console.log( "===== Load =====" );
		console.log( "===== /Load =====" );
	}, false );
	console.log( "===== /Closure =====" );
})();