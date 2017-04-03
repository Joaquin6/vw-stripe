var React = require( "react" );
var SubmitStripeError = React.createClass({
	getInitialState: function() {
		return {

		};
	},
	render: function() {
		var props = this.props;
		var error = props.error;
		var onClickRetry = props.onClickRetry;
		// var onClickSubmit = props.onClickSubmit;
		// <button className="submit" onClick={ onClickSubmit }>Charge To Account</button>
		var onClickClose = props.onClickClose;
		return <div className="submit-stripe-error">
			<p className="message">There was an error submitting your Payment. Please try again.</p>
			<p className="caption">If the problem persists, <span className="key">Cancel</span> and select <span className="key">Charge To Account</span>.</p>
			<div className="buttons">
				<button className="retry" onClick={ onClickRetry }>Try Again</button>
				<button className="close" onClick={ onClickClose }>Cancel</button>
			</div>
		</div>;
	}
});
module.exports = SubmitStripeError;