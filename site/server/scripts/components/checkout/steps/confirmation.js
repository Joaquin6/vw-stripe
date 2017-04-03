var React = require( "react" );
var ItemDetails = require( "../itemDetails" );
var Confirmation = React.createClass({
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
					render = <ItemDetails data={ item } key={ `accessory-${ index + 1 }` } warehouses={ warehouses } />;
				break;
				case "tire":
					render = <ItemDetails data={ item } key={ `tire-${ index + 1 }` } warehouses={ warehouses } />;
				break;
				case "wheel":
					render = <ItemDetails data={ item } key={ `wheel-${ index + 1 }` } warehouses={ warehouses } />;
				break;
			}
			return render;
		});
		return items;
	},
	onClickSubmit: function( event ) {
		var props = this.props;
		props.onSubmit( event );
	},
	onClickPay: function( event ) {
		var props = this.props;
		props.onClickPay( event );
	},
	render: function() {
		var handleItems = this.handleItems;
		var onClickSubmit = this.onClickSubmit;
		var onClickPay = this.onClickPay;
		var props = this.props;
		var state = this.state;
		var payButton = props.canPay ? <button className="button" onClick={ onClickPay }>Pay With Card</button> : <button className="button disabled">Pay With Card</button>;
		var items = handleItems( props.cart, props.warehouses );
		return <div className="confirmation">
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
			<div className="po-number">
				<h1 className="key">Purchase Order #:</h1>
				<p className="value">{ props.po_number }</p>
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
				{ payButton }
				<span className="copy">Or</span>
				<button className="button" onClick={ onClickSubmit }>Charge To Account</button>
			</div>
			<div className="cc">
				<span className="cc-cta">We proudly handle these major credit cards:</span>
				<div className="cc-cta-icons">
					<span className="cc-icons"></span>
				</div>
			</div>
		</div>;
	}
});
module.exports = Confirmation;