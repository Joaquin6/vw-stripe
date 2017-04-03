var React = require( "react" );
var ItemDetails = require( "../itemDetails" );
var Details = React.createClass({
	getInitialState: function() {
		return {

		};
	},
	handleItems: function( cart, warehouses ) {
		var onClickRemoveItem = this.onClickRemoveItem;
		var items = cart.items.map(function( item, index, array ) {
			var type = item.type;
			var render;
			switch( type ) {
				case "accessory":
					render = <ItemDetails data={ item } key={ `accessory-${ index + 1 }` } warehouses={ warehouses } onClickRemoveItem={ onClickRemoveItem } />;
				break;
				case "tire":
					render = <ItemDetails data={ item } key={ `tire-${ index + 1 }` } warehouses={ warehouses } onClickRemoveItem={ onClickRemoveItem } />;
				break;
				case "wheel":
					render = <ItemDetails data={ item } key={ `wheel-${ index + 1 }` } warehouses={ warehouses } onClickRemoveItem={ onClickRemoveItem } />;
				break;
			}
			return render;
		});
		return items;
	},
	handlePending: function() {
		return <div className="pending-disclaimer">
			<p className="message"><span className="label">Please note:</span> Your user status is pending approval, and checkout has been disabled. Once approved, Vision Wheel will typically update your user status between 1 ~ 3 days.</p>
		</div>;
	},
	onClickRemoveItem: function( itemId, location ) {
		var props = this.props;
		props.onClickRemoveItem( itemId, location );
	},
	setStep: function() {
		var props = this.props;
		props.setStep( "shipping" );
	},
	render: function() {
		var handleItems = this.handleItems;
		var handlePending = this.handlePending;
		var setStep = this.setStep;
		var props = this.props;
		var items = handleItems( props.cart, props.warehouses );
		var hasItems = items.length ? true : false;
		var hasSubtotal = props.totals.subtotal ? true : false;
		var userIsPending = props.userIsPending ? true : false;
		var userIsPendingDisclaimer = userIsPending ? handlePending() : null;
		var button = hasItems && hasSubtotal && !userIsPending ? <button className="button" onClick={ setStep }>Next</button> : <button className="button disabled">Next</button>;
		return <div className="details">
			<div className="list">
				{ items }
			</div>
			<span className="underline"></span>
			<div className="subtotal">
				<span className="key">Subtotal: </span>
				<span className="value">{ `$${ props.totals.subtotal || 0 }` }</span>
			</div>
			{ userIsPendingDisclaimer }
			{ button }
		</div>;
	}
});
module.exports = Details;