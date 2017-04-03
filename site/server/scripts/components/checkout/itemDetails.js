var React = require( "react" );
var ItemDetails = React.createClass({
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
	onClickRemoveItem: function( itemId, location ) {
		var props = this.props;
		props.onClickRemoveItem( itemId, location );
	},
	render: function() {
		var handleSpecifications = this.handleSpecifications;
		var onClickRemoveItem = this.onClickRemoveItem;
		var component = this;
		var props = this.props;
		var item = props.data;
		var step = props.step;
		var warehouses = props.warehouses;
		var canRemoveItem = props.onClickRemoveItem ? true : false;
		var showDisclaimer = props.showDisclaimer ? true : false;
		var specifications = handleSpecifications( item );
		console.log( warehouses );
		var items = item.locations.map(function( location, index, array ) {
			var method = warehouses[location.key].method;
			var locationKey = "Shipping";
			var hasDisclaimer = false;
			var disclaimer;
			if( method ) {
				switch( method ) {
					case "pickup":
						locationKey = "Picking Up";
						if( showDisclaimer ) {
							var tollfree = warehouses[location.key].details.tollfree.split( "/" ).map(function( phonenumber, index, array ) { return phonenumber.trim(); });
							var tollfreenumbers = <div className="phonenumbers tollfree">
								<a className="phonenumber" href={ `tel:${ tollfree[0] }` }>{ tollfree[0] }</a>
								<span className="divider">||</span>
								<a className="phonenumber" href={ `tel:${ tollfree[1] }` }>{ tollfree[1] }</a>
							</div>;
							var localnumber = warehouses[location.key].details.localPhone ? <div className="phonenumbers local">
								<a className="phonenumber" href={ `tel:${ warehouses[location.key].details.localPhone }` }>{ warehouses[location.key].details.localPhone }</a>
							</div> : null;
							console.log( tollfree );
							disclaimer = <div className="disclaimer pickup">
								<p className="message">{ `Please call the ${ localnumber ? "local" : "toll free" } phone number for ${ warehouses[location.key].details.name } in ${ warehouses[location.key].details.city }, ${ warehouses[location.key].details.state } to schedule your pick up.` }</p>
								{ localnumber || tollfreenumbers }
								<div className="store-hours">
									<span className="store-hours-key">Store Hours (U.S. Only)</span>
									<div className="days">
										<span className="days-key">Mon - Fri</span>
										<span className="hours">7am - 6pm</span>
									</div>
									<div className="days">
										<span className="days-key">Saturday</span>
										<span className="hours">8am - 12pm</span>
									</div>
								</div>
							</div>;
						}
					break;
				}
			}
			if( disclaimer ) {
				hasDisclaimer = true;
			}
			return <div id={ `item-${ item.id }-${ location.key }` } className="item" key={ `item-${ index + 1 }` }>
				<img className="thumbnail" src={ item.image.list && item.image.list.length ? item.image.list[0] : "https://placehold.it/128x128" } />
				<div className="item-details">
					<div className="label">
						<h1 className="title">{ item.specification.model }</h1>
						{ canRemoveItem ? <span className="delete" onClick={ onClickRemoveItem.bind( component, item.id, location.key ) }>Delete</span> : null }
					</div>
					<div className="specifications">
						<p className="specification part-number">{ `Part #: ${ item.part_number }` }</p>
						{ specifications }
						<p className="specification quantity">{ `Qty: ${ location.quantity }` }</p>
						<p className="specification price">{ `$${ item.price } ea.` }</p>
					</div>
					<div className="location">
						<p className="key">{ `${ locationKey } From:` }</p>
						<p className="label">{ warehouses[location.key].details.name }</p>
						<div className="address">
							<p className="street">{ warehouses[location.key].details.address }</p>
							<span className="city">{ `${ warehouses[location.key].details.city }, ` }</span>
							<span className="state">{ `${ warehouses[location.key].details.state } ` }</span>
							<span className="postal">{ warehouses[location.key].details.postal }</span>
						</div>
						{ hasDisclaimer ? disclaimer : null }
					</div>
				</div>
			</div>;
		});
		return <div className="items">
			{ items }
		</div>;
	}
});
module.exports = ItemDetails;