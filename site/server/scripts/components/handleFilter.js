var React = require( "react" );
var ReactDOM = require( "react-dom" );
var Filter = require( "./filter" );
var handleFilter = function( target, filters, hasWrapper ) {
	ReactDOM.render( <Filter filters={ filters } hasWrapper={ hasWrapper } />, target );
};
module.exports = handleFilter;