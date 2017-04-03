var React = require( "react" );
var AccessorySelector = React.createClass({
	getInitialState: function() {
		var filterItemsByPartNumber = this.filterItemsByPartNumber;
		var filterItemsBySize = this.filterItemsBySize;
		var getFinishes = this.getFinishes;
		var getSizes = this.getSizes;
		var props = this.props;
		var product = props.product;
		var items = product.items && product.items.list && product.items.list.length ? product.items.list : [];
		var item = props.part_number ? filterItemsByPartNumber( items, props.part_number ) : null;
		var specification = item ? item.specification : null;
		var finish = specification ? specification.finish : null;
		var size = specification ? specification.size : null;
		var finishes = item && size ? getFinishes( filterItemsBySize( items, size ) ) : getFinishes( items );
		var sizes = getSizes( items );
		var steps = [];
		var locations = {};
		for( var key in props.warehouses ) {
			locations[key] = {
				key: key,
				isSelected: false,
				quantity: 0,
				details: props.warehouses[key]
			};
		}
		if( finishes.length ) {
			steps.push( "finishes" );
		}
		if( sizes.length ) {
			steps.push( "sizes" );
		}
		// if( !sizes.length && !finish && finishes.length === 1 ) {
		// 	finish = finishes[0];
		// }
		return {
			finish: finish,
			finishes: finishes,
			item: item,
			items: items,
			locations: locations,
			product: product,
			size: size,
			sizes: sizes,
			steps: steps
		};
	},
	filterItemsByFinish: function( items, finish ) {
		var filter = [];
		items.forEach(function( item, index, array ) {
			var specification = item.specification;
			if( specification.finish === finish ) {
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
	filterItemsBySteps: function( items, steps ) {
		var filterItemsByFinish = this.filterItemsByFinish;
		var filterItemsBySize = this.filterItemsBySize;
		var state = this.state;
		var filter = items;
		steps.forEach(function( step, index, array ) {
			switch( step ) {
				case "finishes":
					filter = filterItemsByFinish( filter, state.finish );
				break;
				case "sizes":
					filter = filterItemsBySize( filter, state.size );
				break;
			}
		});
		return filter;
	},
	getFinishes: function( items ) {
		var finishes = [];
		var uniqueFinishes = {};
		items.forEach(function( item, index, array ) {
			var specification = item.specification;
			var finish = specification.finish;
			// TEMP: NA should be null in DB
			if( finish && finish !== "NA" && !uniqueFinishes[finish] ) {
				uniqueFinishes[finish] = true;
			}
		});
		for( var key in uniqueFinishes ) {
			finishes.push( key );
		}
		return finishes;
	},
	getSizes: function( items ) {
		var sizes = [];
		var uniqueSizes = {};
		items.forEach(function( item, index, array ) {
			var specification = item.specification;
			var size = specification.size;
			// TEMP: NA should be null in DB
			if( size && size !== "NA" && !uniqueSizes[size] ) {
				uniqueSizes[size] = true;
			}
		});
		for( var key in uniqueSizes ) {
			sizes.push( key );
		}
		return sizes;
	},
	handleAddToCart: function() {
		var onClickAddToCart = this.onClickAddToCart;
		var state = this.state;
		var locations = state.locations;
		var canAddToCart = false;
		for( var key in locations ) {
			var location = locations[key];
			if( location && location.quantity ) {
				canAddToCart = true;
			}
		}
		return canAddToCart ? <button className="add-to-cart" onClick={ onClickAddToCart }>Add To Cart</button> : <button className="add-to-cart disabled">Add To Cart</button>;
	},
	handleFinishes: function() {
		var component = this;
		var onClickFinish = this.onClickFinish;
		var state = this.state;
		var product = state.product;
		var hasSelected = state.finish ? true : false;
		var classNameFinishes = hasSelected ? "section finishes has-selected" : "section finishes";
		var images = {};
		var finishes;
		product.image.list.forEach(function( image, index, array ) {
			if( !images[image.finish] ) {
				images[image.finish] = image.src;
			}
		});
		finishes = state.size ? <div className="list horizontal-scroll">
			{
				state.finishes.map(function( finish, index, array ) {
					var isSelected = state.finish === finish;
					var classNameFinish = isSelected ? "list-item finish selected horizontal-scroll-item" : "list-item finish horizontal-scroll-item";
					return <div className={ classNameFinish } onClick={ onClickFinish.bind( component, finish ) } key={ `finish-${ index + 1 }` }>
						<div className="thumbnail-container">
							<img className="thumbnail" src={ images[finish] || "https://placehold.it/320x320" } />
						</div>
						<span className="copy">{ finish }</span>
					</div>;
				})
			}
		</div> : false;
		return <div className={ classNameFinishes }>
			<div className="label">
				<span className="key">2.</span>
				<div className="content">
					<span className="subheading">Choose From The Available Finishes</span>
				</div>
			</div>
			{ finishes }
		</div>;
	},
	handleItems: function() {
		var component = this;
		var filterItemsBySteps = this.filterItemsBySteps;
		var onClickItem = this.onClickItem;
		var validateSteps = this.validateSteps;
		var state = this.state;
		var isValid = validateSteps( state.steps );
		var hasSelected = state.item ? true : false;
		var classNameItems = hasSelected ? "section items has-selected" : "section items";
		var items = isValid ? <div className="table">
			<div className="content">
				<div className="rows">
					<div className="row columns">
						<span className="column large part-number">Item No.</span>
						<span className="column medium">Size</span>
						<span className="column large">Description</span>
						<span className="column medium">Finish</span>
						<span className="column large">Additional Info</span>
						<span className="column large">Product Type</span>
					</div>
					{
						filterItemsBySteps( state.items, state.steps ).map(function( item, index, array ) {
							var isSelected = state.item && (state.item.id === item.id);
							var classNameRow = isSelected ? "row selected" : "row";
							return <div className={ classNameRow } onClick={ onClickItem.bind( component, item ) } key={ `item-${ index + 1 }` }>
								<span className="column large part-number">{ item.part_number }</span>
								<span className="column medium">{ item.specification.size }</span>
								<span className="column large">{ item.specification.description }</span>
								<span className="column medium">{ item.specification.finish }</span>
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
		var caption = isValid ? <span className="caption">(Please review technical specs associated with each part number.)</span> : false;
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
				<span className="key">{ `${ state.steps.length + 1 }.` }</span>
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
				<span className="key">{ `${ state.steps.length + 2 }.` }</span>
				<div className="content">
					<span className="subheading">View each warehouse's available inventory and enter your desired quantity below. *</span>
					{ caption }
				</div>
			</div>
			{ locationsList }
		</div>;
	},
	handleSizes: function() {
		var component = this;
		var onClickSize = this.onClickSize;
		var state = this.state;
		var hasSelected = state.size ? true : false;
		var classNameSizes = hasSelected ? "section sizes has-selected" : "section sizes";
		return <div className={ classNameSizes }>
			<div className="label">
				<span className="key">1.</span>
				<div className="content">
					<span className="subheading">Choose From Available Sizes</span>
				</div>
			</div>
			<div className="list">
				{
					state.sizes.map(function( size, index, array ) {
						var isSelected = state.size === size;
						var classNameSize = isSelected ? "list-item size selected" : "list-item size";
						return <span className={ classNameSize } onClick={ onClickSize.bind( component, size ) } key={ `size-${ index + 1 }` }>{ size }</span>
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
	onClickFinish: function( finish ) {
		var resetQuantities = this.resetQuantities;
		var setState = this.setState.bind( this );
		var state = this.state;
		var locations = resetQuantities( state.locations );
		setState({
			finish: finish,
			item: null,
			locations: locations
		});
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
	onClickSize: function( size ) {
		var filterItemsBySize = this.filterItemsBySize;
		var getFinishes = this.getFinishes;
		var resetQuantities = this.resetQuantities;
		var setState = this.setState.bind( this );
		var state = this.state;
		var finishes = getFinishes( filterItemsBySize( state.items, size ) );
		var locations = resetQuantities( state.locations );
		var defaultFinish = (finishes.length === 1 ? finishes[0] : "");
		var hasFinish = false;
		finishes.forEach(function( finish, index, array ) {
			if( finish === state.finish ) {
				hasFinish = true;
			}
		});
		setState({
			finish: hasFinish ? state.finish : defaultFinish,
			finishes: finishes,
			item: null,
			locations: locations,
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
	validateSteps: function( steps ) {
		var state = this.state;
		var valid = true;
		steps.forEach(function( step, index, array ) {
			if( valid ) {
				switch( step ) {
					case "finishes":
						valid = !state.finishes.length || state.finish ? true : false;
					break;
					case "sizes":
						valid = !state.sizes.length || state.size ? true : false;
					break;
				}
			}
		});
		console.log( valid );
		return valid;
	},
	render: function() {
		var handleAddToCart = this.handleAddToCart;
		var handleFinishes = this.handleFinishes;
		var handleItems = this.handleItems;
		var handleLocations = this.handleLocations;
		var handleSizes = this.handleSizes;
		var state = this.state;
		var addToCart = handleAddToCart();
		var finishes = state.finishes.length ? handleFinishes() : null;
		var items = handleItems();
		var locations = handleLocations();
		var sizes = state.sizes.length ? handleSizes() : null;
		return <div id="accessory-selector">
			{ sizes }
			{ sizes ? <span className="underline" /> : null }
			{ finishes }
			{ finishes ? <span className="underline" /> : null }
			{ items }
			<span className="underline" />
			{ locations }
			{ addToCart }
		</div>;
	}
});
module.exports = AccessorySelector;