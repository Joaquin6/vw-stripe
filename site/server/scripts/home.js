var common = require( "./components/common" );
var handleFilter = require( "./components/handleFilter" );
require( "../styles/home.scss" );
(function() {
	console.log( "===== Closure =====" );
	window.addEventListener( "DOMContentLoaded", function( event ) {
		console.log( "===== DOMContentLoaded =====" );
		var filter = document.querySelectorAll( ".filter" )[0];
		var filters = filter.getAttribute( "data" );
		var filtersJSON;
		common();
		try {
			filtersJSON = JSON.parse( filters );
			handleFilter( filter, filtersJSON );
		}
		catch( error ) {
			console.log( "Error: missing filters;" );
			console.log( error );
		}
		console.log( "===== /DOMContentLoaded =====" );
	}, false );
	window.addEventListener( "load", function( event ) {
		console.log( "===== Load =====" );
		console.log( "===== /Load =====" );
	}, false );
	console.log( "===== /Closure =====" );
})();