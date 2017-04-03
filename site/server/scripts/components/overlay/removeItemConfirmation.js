var React = require( "react" );
var RemoveItemConfirmation = React.createClass({
	getInitialState: function() {
		return {

		};
	},
	render: function() {
		var props = this.props;
		var onClickClose = props.onClickClose;
		var onClickSubmit = props.onClickSubmit;
		return <div className="remove-item-confirmation">
			<p className="message">Are you sure you would like to remove this item from your cart?</p>
			<div className="buttons">
				<button className="close" onClick={ onClickClose }>No</button>
				<button className="submit" onClick={ onClickSubmit }>Yes</button>
			</div>
		</div>;
	}
});
module.exports = RemoveItemConfirmation;