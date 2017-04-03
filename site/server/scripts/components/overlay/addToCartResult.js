var React = require( "react" );
var AddToCartResult = React.createClass({
	getInitialState: function() {
		return {

		};
	},
	handleSpecifications: function( item ) {
		var children = [];
		var specifications = [];
		for( var key in item.specification ) {
			var value = item.specification[key];
			specifications.push({
				key: key,
				value: value
			});
		}
		specifications.forEach(function( specification, index, array ) {
			var render = <p className={ `specification ${ specification.key }` } key={ `specification-${ index + 1 }` }>{ `${ specification.key.charAt( 0 ).toUpperCase() + specification.key.slice( 1 ) }: ${ specification.value }` }</p>;
			var isValid = false;
			switch( item.type ) {
				case "accessory":
					switch( specification.key ) {
						case "finish":
						case "size":
							// TEMP: remove "NA" values from db
							isValid = specification.value && specification.value !== "NA" ? true : false;
						break;
					}
				break;
				case "tire":
					switch( specification.key ) {
						case "ply":
						case "size":
							isValid = true;
						break;
					}
				break;
				case "wheel":
					switch( specification.key ) {
						case "finish":
						case "size":
							isValid = true;
						break;
					}
				break;
			}
			if( isValid ) {
				children.push( render );
			}
		});
		return children;
	},
	onClickClose: function( event ) {
		var props = this.props;
		props.onClickClose( event );
	},
	render: function() {
		var component = this;
		var handleSpecifications = this.handleSpecifications;
		var onClickClose = this.onClickClose;
		var props = this.props;
		console.log( props );
		var result = props.result;
		var warehouses = props.warehouses;
		var error = result.error;
		var className = error ? "add-to-cart-result error" : "add-to-cart-result success";
		var button = <button className="toggle-overlay" onClick={ onClickClose }>Keep Shopping</button>;
		var message;
		if( !error ) {
			var data = result.data;
			var item = data.details;
			var locations = data.locations;
			var specifications = handleSpecifications( item );
			var items = [];
			var count = 0;
			for( var key in locations ) {
				var quantity = locations[key].quantity;
				count++;
				items.push(
					<div id={ `item-${ item.id }-${ key }` } className="item" key={ `item-${ item.id }-${ key }` }>
						<img className="thumbnail" src={ item.image.list && item.image.list.length ? item.image.list[0] : "https://placehold.it/128x128" } />
						<div className="item-details">
							<div className="label">
								<h1 className="title">{ item.specification.model }</h1>
							</div>
							<div className="specifications">
								<p className="specification part-number">{ `Part #: ${ item.part_number }` }</p>
								{ specifications }
								<p className="specification quantity">{ `Qty: ${ quantity }` }</p>
							</div>
							<div className="location">
								<p className="key">Shipping From:</p>
								<p className="label">{ warehouses[key].name }</p>
								<div className="address">
									<p className="street">{ warehouses[key].address }</p>
									<span className="city">{ `${ warehouses[key].city }, ` }</span>
									<span className="state">{ `${ warehouses[key].state } ` }</span>
									<span className="postal">{ warehouses[key].postal }</span>
								</div>
							</div>
						</div>
					</div>
				);
			}
			message = <div className="add-to-cart-message">
				<div className="subheading">
					<span className="count">{ count > 1 ? `${ count } Items ` : "1 Item " }</span>
					<span className="copy">added to your cart.</span>
				</div>
				<div className="items">
					{ items }
				</div>
				<div className="buttons">
					<a className="checkout" href="/checkout">Checkout</a>
					{ button }
				</div>
			</div>;
		}
		else {
			message = <div className="add-to-cart-message">
				<span>Error</span>
				<span>{ JSON.stringify( error ) }</span>
				{ button }
			</div>;
		}
		return <div className={ className }>
			{ message }
		</div>;
	}
});
module.exports = AddToCartResult;