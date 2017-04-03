var React = require( "react" );
var TireSelector = React.createClass({
	getInitialState: function() {
		var filterItemsByPartNumber = this.filterItemsByPartNumber;
		var getPlyAndSizes = this.getPlyAndSizes;
		var props = this.props;
		var product = props.product;
		var items = product.items && product.items.list && product.items.list.length ? product.items.list : [];
		var item = props.part_number ? filterItemsByPartNumber( items, props.part_number ) : null;
		var specification = item ? item.specification : null;
		var ply = specification ? specification.ply : null;
		var size = specification ? specification.size : null;
		var plyAndSizes = getPlyAndSizes( items );
		var locations = {};
		for( var key in props.warehouses ) {
			locations[key] = {
				key: key,
				isSelected: false,
				quantity: 0,
				details: props.warehouses[key]
			};
		}
		return {
			item: item,
			items: items,
			locations: locations,
			product: product,
			ply: ply,
			size: size,
			plyAndSizes: plyAndSizes
		};
	},
	filterItemsByPly: function( items, ply ) {
		var filter = [];
		items.forEach(function( item, index, array ) {
			var specification = item.specification;
			if( specification.ply === ply ) {
				filter.push( item );
			}
		});
		return filter;
	},
	filterItemsByPartNumber: function( items, part_number ) {
		var item;
		items.forEach(function( itm, index, array ) {
			if( itm.part_number === part_number ) {
				item = itm;
			}
		});
		return item;
	},
	filterItemsBySize: function( items, size ) {
		var filter = [];
		items.forEach(function( item, index, array ) {
			var specification = item.specification;
			if( specification.size === size ) {
				filter.push( item );
			}
		});
		return filter;
	},
	getPlyAndSizes: function( items ) {
		var plyAndSizes = [];
		var uniquePlyAndSizes = {};
		items.forEach(function( item, index, array ) {
			var specification = item.specification;
			var ply = specification.ply;
			var size = specification.size;
			if( ply && size && !uniquePlyAndSizes[`${ size }_${ ply }`] ) {
				uniquePlyAndSizes[`${ size }_${ ply }`] = {
					ply: ply,
					size: size
				};
			}
		});
		for( var key in uniquePlyAndSizes ) {
			plyAndSizes.push( uniquePlyAndSizes[key] );
		}
		return plyAndSizes;
	},
	handleAddToCart: function() {
		var onClickAddToCart = this.onClickAddToCart;
		var state = this.state;
		var locations = state.locations;
		var canAddToCart = false;
		for( var key in locations ) {
			if( locations[key] && locations[key].quantity ) {
				canAddToCart = true;
			}
		}
		return canAddToCart ? <button className="add-to-cart" onClick={ onClickAddToCart }>Add To Cart</button> : <button className="add-to-cart disabled">Add To Cart</button>;
	},
	handleItems: function() {
		var component = this;
		var filterItemsByPly = this.filterItemsByPly;
		var filterItemsBySize = this.filterItemsBySize;
		var onClickItem = this.onClickItem;
		var state = this.state;
		var hasSelected = state.item ? true : false;
		var classNameItems = hasSelected ? "section items has-selected" : "section items";
		var items = (state.ply && state.size) ? <div className="table">
			<div className="content">
				<div className="rows">
					<div className="row columns">
						<span className="column large part-number">Item No.</span>
						<span className="column medium">Size</span>
						<span className="column medium">Search Size</span>
						<span className="column large">Description</span>
						<span className="column small">Pattern</span>
						<span className="column small">Ply</span>
						<span className="column large">Additional Info</span>
						<span className="column large">Product Type</span>
					</div>
					{
						filterItemsByPly( filterItemsBySize( state.items, state.size ), state.ply ).map(function( item, index, array ) {
							var isSelected = state.item && (state.item.id === item.id);
							var classNameRow = isSelected ? "row selected" : "row";
							return <div className={ classNameRow } onClick={ onClickItem.bind( component, item ) } key={ `item-${ index + 1 }` }>
								<span className="column large part-number">{ item.part_number }</span>
								<span className="column medium">{ item.specification.size }</span>
								<span className="column medium">{ item.specification.search_description }</span>
								<span className="column large">{ item.specification.description }</span>
								<span className="column small">{ item.specification.model }</span>
								<span className="column small">{ item.specification.ply }</span>
								<span className="column large">{ item.specification.additional_info }</span>
								<span className="column large">{ item.specification.product_type }</span>
							</div>;
						})
					}
				</div>
			</div>
			<div className="caption">
				<span>Scroll to see full specifications</span>
				<span className="mobile-only">, or for better quality, please view on a larger monitor</span>
				<span>.</span>
			</div>
		</div> : false;
		var caption = (state.ply && state.size) ? <span className="caption">(Please review technical specs associated with each part number.)</span> : false;
		var notes = hasSelected && state.item.specification.special_notes ? <div className="notes">
			<span className="key">Note:</span>
			<span className="copy">{ state.item.specification.special_notes }</span>
		</div> : false;
		var item = hasSelected ? <div className="label item">
			<span className="key">Part Number: </span>
			<div className="content">
				<span className="subheading">{ state.item.part_number }</span>
			</div>
		</div> : false;
		return <div className={ classNameItems }>
			<div className="label">
				<span className="key">2.</span>
				<div className="content">
					<span className="subheading">Select A Part Number</span>
					{ caption }
				</div>
			</div>
			{ items }
			{ item }
			{ notes }
		</div>;
	},
	handleLocations: function() {
		var component = this;
		var onChangeQuantity = this.onChangeQuantity;
		var onClickLocation = this.onClickLocation;
		var state = this.state;
		var locations = [];
		var locationsList = null;
		var caption = null;
		if( state.item ) {
			for( var key in state.locations ) {
				var location = state.locations[key];
				locations.push( location );
			}
			locationsList = <div className="list">
				{
					locations.map(function( location, index, array ) {
						var isSelected = location.isSelected ? true : false;
						var underline = (index !== locations.length - 1) ? <span className="underline" /> : false;
						return <div className="list-item location" key={ `location-${ index + 1 }` }>
							<div className="details">
								<span className="name">{ location.details.name }</span>
								<div className="address">
									<span className="copy">{ location.details.address }, </span>
									<span className="copy">{ location.details.city }, </span>
									<span className="copy">{ location.details.state }, </span>
									<span className="copy">{ location.details.postal }</span>
								</div>
							</div>
							<div className="quantity">
								<div className="available">
									<div className="subheading">
										<span className="copy">Available</span>
										<span className="copy">Inventory</span>
									</div>
									<input className="amount" value={ state.item.inventory[location.key] } readOnly="readonly" />
								</div>
								<div className="requested">
									<div className="subheading">
										<span className="copy">Requested</span>
										<span className="copy">Quantity</span>
									</div>
									<input className="amount" onChange={function( event ) {
										var target = event.target;
										var value = target.value;
										onChangeQuantity( location.key, value );
									}} value={ location.quantity } />
								</div>
							</div>
							<div className="checkbox">
								<input id={ `location-${ location.key }` } name={ `location-${ location.key }` } type="checkbox" checked={ isSelected ? "checked" : "" } />
								<label htmlFor={ `location-${ location.key }` } onClick={ onClickLocation.bind( component, location.key ) }>Order from this location</label>
							</div>
							{ underline }
						</div>;
					})
				}
			</div>;
			caption = <div className="caption">
				<span className="copy">* If your entire quantity is not available at any one location, your full order may require a 90-plus day lead time to fulfill. Or, you may select more than one warehouse in order to accumulate your total requested quantity.</span>
				<a className="link" href="/contact">For questions, please visit our CONTACT US page.</a>
			</div>;
		}
		return <div className="section locations">
			<div className="label">
				<span className="key">3.</span>
				<div className="content">
					<span className="subheading">View each warehouse's available inventory and enter your desired quantity below. *</span>
					{ caption }
				</div>
			</div>
			{ locationsList }
		</div>;
	},
	handlePlyAndSizes: function() {
		var component = this;
		var onClickPlyAndSize = this.onClickPlyAndSize;
		var state = this.state;
		var hasSelected = state.ply && state.size ? true : false;
		var classNamePlyAndSizes = hasSelected ? "section ply-and-sizes has-selected" : "section ply-and-sizes";
		return <div className={ classNamePlyAndSizes }>
			<div className="label">
				<span className="key">1.</span>
				<div className="content">
					<span className="subheading">Choose From The Available Sizes & Ply Numbers</span>
				</div>
			</div>
			<div className="list">
				{
					state.plyAndSizes.map(function( data, index, array ) {
						var ply = data.ply;
						var size = data.size;
						var isSelected = state.ply === ply && state.size === size;
						var classNamePlyAndSize = isSelected ? "list-item ply-and-size selected" : "list-item ply-and-size";
						return <div className={ classNamePlyAndSize } onClick={ onClickPlyAndSize.bind( component, data ) } key={ `size-${ index + 1 }` }>
							<span className="key">Size:</span>
							<span className="value">{ size }</span>
							<span className="key">Ply:</span>
							<span className="value">{ ply }</span>
						</div>;
					})
				}
			</div>
		</div>;
	},
	onChangeQuantity: function( key, value ) {
		console.log( key );
		console.log( value );
		var setState = this.setState.bind( this );
		var state = this.state;
		var locations = state.locations;
		var location = locations[key];
		if( value && !isNaN( value ) ) {
			if( !location.isSelected ) {
				location.isSelected = true;
			}
			location.quantity = Math.abs( parseInt( value ) );
			setState({
				locations: locations
			});
		}
		else if( !value ) {
			if( location.isSelected ) {
				location.isSelected = false;
			}
			location.quantity = 0;
			setState({
				locations: locations
			});
		}
	},
	onClickAddToCart: function( event ) {
		var state = this.state;
		var props = this.props;
		var item = state.item;
		var locations = state.locations;
		props.onClickAddToCart( item.id, locations );
	},
	onClickItem: function( item ) {
		var resetQuantities = this.resetQuantities;
		var setState = this.setState.bind( this );
		var state = this.state;
		var locations = resetQuantities( state.locations );
		setState({
			item: item,
			locations: locations
		});
	},
	onClickLocation: function( key ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		var locations = state.locations;
		var location = locations[key];
		location.isSelected = !location.isSelected ? true : false;
		if( !location.isSelected ) {
			location.quantity = 0;
		}
		setState({
			locations: locations
		});
	},
	onClickPlyAndSize: function( data ) {
		var resetQuantities = this.resetQuantities;
		var setState = this.setState.bind( this );
		var state = this.state;
		var locations = resetQuantities( state.locations );
		var ply = data.ply;
		var size = data.size;
		setState({
			item: null,
			locations: locations,
			ply: ply,
			size: size
		});
	},
	resetQuantities: function( locations ) {
		for( var key in locations ) {
			var location = locations[key];
			location.isSelected = false;
			location.quantity = 0;
		}
		return locations;
	},
	render: function() {
		var handleAddToCart = this.handleAddToCart;
		var handleItems = this.handleItems;
		var handleLocations = this.handleLocations;
		var handlePlyAndSizes = this.handlePlyAndSizes;
		var state = this.state;
		var addToCart = handleAddToCart();
		var items = handleItems();
		var locations = handleLocations();
		var plyAndSizes = handlePlyAndSizes();
		return <div id="tire-selector">
			{ plyAndSizes }
			<span className="underline" />
			{ items }
			<span className="underline" />
			{ locations }
			{ addToCart }
		</div>;
	}
});
module.exports = TireSelector;