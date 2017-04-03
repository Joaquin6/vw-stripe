var React = require( "react" );
var SubmitShippingError = React.createClass({
	getInitialState: function() {
		return {

		};
	},
	render: function() {
		var props = this.props;
		var error = props.error;
		var onClickRetry = props.onClickRetry;
		var onClickClose = props.onClickClose;
		return <div className="submit-shipping-error">
			<p className="message">There was an error calculating your Totals. Please try again.</p>
			<p className="caption">If the problem persists, do not hesistate to <a href="/contact">Contact Us.</a></p>
			<div className="buttons">
				<button className="retry" onClick={ onClickRetry }>Try Again</button>
				<button className="close" onClick={ onClickClose }>Cancel</button>
			</div>
		</div>;
	}
});
module.exports = SubmitShippingError;