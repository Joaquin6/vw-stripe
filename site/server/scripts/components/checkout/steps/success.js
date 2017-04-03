var React = require( "react" );
var ItemDetails = require( "../itemDetails" );
var Success = React.createClass({
	getInitialState: function() {
		return {

		};
	},
	handleItems: function( cart, warehouses ) {
		var items = cart.items.map(function( item, index, array ) {
			var type = item.type;
			var render;
			switch( type ) {
				case "accessory":
					render = <ItemDetails data={ item } key={ `accessory-${ index + 1 }` } warehouses={ warehouses } showDisclaimer={ true } />;
				break;
				case "tire":
					render = <ItemDetails data={ item } key={ `tire-${ index + 1 }` } warehouses={ warehouses } showDisclaimer={ true } />;
				break;
				case "wheel":
					render = <ItemDetails data={ item } key={ `wheel-${ index + 1 }` } warehouses={ warehouses } showDisclaimer={ true } />;
				break;
			}
			return render;
		});
		return items;
	},
	render: function() {
		var handleItems = this.handleItems;
		var props = this.props;
		var items = handleItems( props.cart, props.warehouses );
		return <div className="success">
			<div className="header">
				<h1 className="headline">Order Summary</h1>
				<h2 className="label">Thanks for ordering!</h2>
				<p className="thankyou">Your order was send to Vision Wheel.</p>
				<div className="po-number">
					<h1 className="key">Purchase Order #:</h1>
					<p className="value">{ props.po_number }</p>
				</div>
				<p className="copy">A detailed receipt will be emailed you shortly.</p>
			</div>
			<span className="underline"></span>
			<div className="list">
				{ items }
			</div>
			<div className="address">
				<h1 className="label">Shipping To:</h1>
				<div className="fields">
					<p className="field">{ props.shipping.company }</p>
					<p className="field">{ `${ props.shipping.first_name } ${ props.shipping.last_name }` }</p>
					<p className="field">{ props.shipping.address_1 }</p>
					<p className="field">{ `${ props.shipping.city } ${ props.shipping.state } ${ props.shipping.postalcode }` }</p>
				</div>
			</div>
			<span className="underline"></span>
			<div className="totals">
				<div className="subtotal">
					<span className="key">Subtotal:</span>
					<span className="value">{ `$${ props.totals.subtotal }` }</span>
				</div>
				<div className="shippingtotal">
					<span className="key">Shipping:</span>
					<span className="value">{ props.canPay ? `$${ props.totals.shippingtotal }` : "Pending *" }</span>
				</div>
				<div className="taxtotal">
					<span className="key">Tax:</span>
					<span className="value">{ props.canPay ? `$${ props.totals.taxtotal }` : "Pending *" }</span>
				</div>
				<div className="total">
					<span className="key">Total:</span>
					<span className="value">{ props.canPay ? `$${ props.totals.total }` : "Pending *" }</span>
				</div>
				{ !props.canPay ? <div className="disclaimer">
					<p className="caption"><span className="key">Please note:</span> Pending charges will be applied to your totals automatically. Please allow up to 1-3 business days for our system to generate remaining charges for your purchase order.</p>
					<p className="copy">You will receive an updated email notification with instructions and details.</p>
				</div> : null }
			</div>
			<div className="buttons">
				<a className="button" href="/">Back to Home</a>
			</div>
		</div>;
	}
}); 
module.exports = Success;