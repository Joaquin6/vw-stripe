var common = require( "./components/common" );
var handleFilter = require( "./components/handleFilter" );
require( "../styles/accessories.scss" );
require( "../images/accessories/caps.jpg" );
require( "../images/accessories/hub-covers.jpg" );
require( "../images/accessories/installation-kits-and-washers.jpg" );
require( "../images/accessories/lug-nuts-and-locks.jpg" );
require( "../images/accessories/rings.jpg" );
require( "../images/accessories/rallye.jpg" );
require( "../images/accessories/valve-stems-and-spacers.jpg" );
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
      handleFilter( filter, filtersJSON, true );
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