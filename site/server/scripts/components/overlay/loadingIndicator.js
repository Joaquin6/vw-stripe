var React = require( "react" );
var LoadingIndicator = React.createClass({
	render: function() {
		return (
			<div className="loading-indicator"><span className="loading-icon"></span></div>
		);
	}
});
module.exports = LoadingIndicator;