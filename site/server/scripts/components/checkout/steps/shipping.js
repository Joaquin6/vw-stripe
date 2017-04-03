var React = require( "react" );
var Shipping = React.createClass({
	getInitialState: function() {
		var props = this.props;
		var warehouses = props.warehouses;
		var enableExpedited = {};
		var toggleExpedited = {};
		var toggleLTL = {};
		var togglePickup = {};
		for( var key in warehouses ) {
			enableExpedited[key] = false;
			toggleExpedited[key] = false;
			toggleLTL[key] = false;
			togglePickup[key] = false;
		}
		return {
			enableExpedited: enableExpedited,
			toggleExpedited: toggleExpedited,
			toggleLTL: toggleLTL,
			togglePickup: togglePickup
		};
	},
	handleFields: function( fields, shipping, po_number ) {
		var onChangePONumberField = this.onChangePONumberField;
		var onChangeShippingField = this.onChangeShippingField;
		var render = fields.map(function( field, index, array ) {
			var value = shipping[field.name] || "";
			var caption = field.caption ? <p className="caption">{ field.caption }</p> : null;
			return <div className="fieldset" key={ `shipping-field-${ index + 1 }` }>
				<input className="field" name={ field.name } value={ value } placeholder={ field.label } onChange={ onChangeShippingField } />
				{ caption }
			</div>;
		});
		return <div className="fields">
			<h1 className="title">Purchase Order #</h1>
			<div className="fieldset">
				<input className="field" name="po_number" value={ po_number } placeholder="Enter your desired PO #" onChange={ onChangePONumberField } />
			</div>
			<h1 className="title">Shipping Address</h1>
			{ render }
		</div>;
	},
	handleWarehouses: function( warehouses ) {
		var component = this;
		var onClickEnableExpedited = this.onClickEnableExpedited;
		var onClickShippingMethod = this.onClickShippingMethod;
		var onClickToggleExpedited = this.onClickToggleExpedited;
		var onClickToggleLTL = this.onClickToggleLTL;
		var onClickTogglePickup = this.onClickTogglePickup;
		var state = this.state;
		var enableExpedited = state.enableExpedited;
		var toggleExpedited = state.toggleExpedited;
		var toggleLTL = state.toggleLTL;
		var togglePickup = state.togglePickup;
		var render = [];
		for( var key in warehouses ) {
			var warehouse = warehouses[key];
			var method = warehouse.method;
			var option = warehouse.option;
			var classNameWarehouse = method ? "warehouse has-selected" : "warehouse";
			var classNameExpedited = method === "expedited" ? "method expedited selected" : "method expedited";
			var classNameLTL = method === "ltl" ? "method ltl selected" : "method ltl";
			var classNamePickup = method === "pickup" ? "method pickup selected" : "method pickup";
			var classNameStandard = method === "standard" ? "method standard selected" : "method standard";
			var items = warehouse.items.map(function( data, index, array ) {
				var item = data.item;
				// var quantity = data.quantity;
				return <div className="item" key={ `warehouse-${ key }-item-${ index + 1 }` }>
					<p className="specification model">{ data.item.specification.model }</p>
					<p className="specification">{ `Part #: ${ data.item.part_number }` }</p>
				</div>;
			});
			if( toggleExpedited[key] ) {
				classNameExpedited += " toggle";
			}
			if( toggleLTL[key] ) {
				classNameLTL += " toggle";
			}
			if( togglePickup[key] ) {
				classNamePickup += " toggle";
			}
			render.push(
				<div className={ classNameWarehouse } name={ key } key={ `warehouse-${ key }` }>
					<div className="warehouse-details">
						<div className="location">
							<p className="key">Shipping From:</p>
							<p className="label">{ warehouses[key].details.name }</p>
							<div className="address">
								<p className="street">{ warehouses[key].details.address }</p>
								<span className="city">{ `${ warehouses[key].details.city }, ` }</span>
								<span className="state">{ `${ warehouses[key].details.state } ` }</span>
								<span className="postal">{ warehouses[key].details.postal }</span>
							</div>
						</div>
						<div className="list">
							<p className="key">{ items.length === 1 ? "Item:" : "Items:" }</p>
							<div className="items">
								{ items }
							</div>
						</div>
					</div>
					<div className="delivery">
						<h2 className="title">Choose A Delivery Method</h2>
						<div className="methods">
							<div className={ classNameStandard }>
								<button className="label" onClick={ onClickShippingMethod.bind( component, key, "standard" ) }>Standard Shipping</button>
							</div>
							<div className={ classNameLTL }>
								<button className="label" onClick={ onClickToggleLTL.bind( component, key ) }>LTL Shipping *</button>
								<div className="disclaimer">
									<p className="caption"><span className="key">Please note:</span> Because freight charges will automatically be applied to your overall totals, Vision Wheel can only accept Purchase Orders for LTL Shipping.</p>
									<div className="checkbox">
										<input id={ `warehouse-${ key }-ltl` } name={ `warehouse-${ key }-ltl` } type="checkbox" checked={ method === "ltl" ? "checked" : "" } />
										<label htmlFor={ `warehouse-${ key }-ltl` } onClick={ onClickShippingMethod.bind( component, key, "ltl" ) }>* I acknowledge that freight charges will be automatically applied to my total at a later date.</label>
									</div>
								</div>
							</div>
							<div className={ classNameExpedited }>
								<button className="label" onClick={ onClickToggleExpedited.bind( component, key ) }>Expedited Shipping *</button>
								<div className="disclaimer">
									<p className="caption"><span className="key">Please note:</span> Because freight charges will automatically be applied to your overall totals, Vision Wheel can only accept Purchase Orders for Expedited Shipping.</p>
									<div className="checkbox">
										<input id={ `warehouse-${ key }-expedited` } name={ `warehouse-${ key }-enable-expedited` } type="checkbox" checked={ enableExpedited[key] ? "checked" : "" } disabled={ enableExpedited[key] ? "" : "disabled" } />
										<label htmlFor={ `warehouse-${ key }-expedited` } onClick={ onClickEnableExpedited.bind( component, key ) }>* I acknowledge that freight charges will be automatically applied to my total at a later date.</label>
									</div>
									<div className={ enableExpedited[key] ? "radios" : "radios disabled" }>
										<div className="radio">
											<input id={ `warehouse-${ key }-expedited-2-day` } name={ `warehouse-${ key }-expedited` } type="radio" checked={ enableExpedited[key] && method === "expedited" && option === "2 day" ? "checked" : "" } disabled={ enableExpedited[key] ? "" : "disabled" } />
											{ enableExpedited[key] ? <label htmlFor={ `warehouse-${ key }-expedited-2-day` } onClick={ onClickShippingMethod.bind( component, key, "expedited", "2 day" ) }>Expedited Shipping - 2 Day</label> : <label htmlFor={ `warehouse-${ key }-expedited-2-day` }>Expedited Shipping - 2 Day</label> }
										</div>
										<div className="radio">
											<input id={ `warehouse-${ key }-expedited-overnight` } name={ `warehouse-${ key }-expedited` } type="radio" checked={ enableExpedited[key] && method === "expedited" && option === "overnight" ? "checked" : "" } disabled={ enableExpedited[key] ? "" : "disabled" } />
											{ enableExpedited[key] ? <label htmlFor={ `warehouse-${ key }-expedited-overnight` } onClick={ onClickShippingMethod.bind( component, key, "expedited", "overnight" ) }>Expedited Shipping - Overnight</label> : <label htmlFor={ `warehouse-${ key }-expedited-overnight` }>Expedited Shipping - Overnight</label> }
										</div>
									</div>
								</div>
							</div>
							<div className={ classNamePickup }>
								<button className="label" onClick={ onClickTogglePickup.bind( component, key ) }>Pickup *</button>
								<div className="disclaimer">
									<p className="caption"><span className="key">Please note:</span> You will be responsible for calling our Vision Wheel Warehouse in order to schedule a date and time for pickup. A warehouse and phone number will be provided after check-out.</p>
									<div className="checkbox">
										<input id={ `warehouse-${ key }-pickup` } name={ `warehouse-${ key }-pickup` } type="checkbox" checked={ method === "pickup" ? "checked" : "" } />
										<label htmlFor={ `warehouse-${ key }-pickup` } onClick={ onClickShippingMethod.bind( component, key, "pickup" ) }>* I acknowledge that I must call the Vision Wheel Warehouse and schedule a date and time for pickup.</label>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		}
		return <div className="warehouses">
			{ render }
		</div>;
	},
	onChangePONumberField: function( event ) {
		var props = this.props;
		props.onChangePONumberField( event );
	},
	onChangeShippingField: function( event ) {
		var props = this.props;
		props.onChangeShippingField( event );
	},
	onClickEnableExpedited: function( key ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		var enableExpedited = state.enableExpedited;
		enableExpedited[key] = true;
		setState({
			enableExpedited: enableExpedited
		});
	},
	onClickToggleExpedited: function( key ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		var toggleExpedited = state.toggleExpedited;
		toggleExpedited[key] = toggleExpedited[key] ? false : true;
		setState({
			toggleExpedited: toggleExpedited
		});
	},
	onClickToggleLTL: function( key ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		var toggleLTL = state.toggleLTL;
		toggleLTL[key] = toggleLTL[key] ? false : true;
		setState({
			toggleLTL: toggleLTL
		});
	},
	onClickTogglePickup: function( key ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		var togglePickup = state.togglePickup;
		togglePickup[key] = togglePickup[key] ? false : true;
		setState({
			togglePickup: togglePickup
		});
	},
	onClickShippingMethod: function( key, value, option ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		var props = this.props;
		var enableExpedited = state.enableExpedited;
		var toggleExpedited = state.toggleExpedited;
		var toggleLTL = state.toggleLTL;
		var togglePickup = state.togglePickup;
		enableExpedited[key] = value !== "expedited" ? false : true;
		toggleExpedited[key] = value !== "expedited" ? false : true;
		toggleLTL[key] = value !== "ltl" ? false : true;
		togglePickup[key] = value !== "pickup" ? false : true;
		option = typeof option === "string" ? option : "";
		setState({
			toggleExpedited: toggleExpedited,
			toggleLTL: toggleLTL,
			togglePickup: togglePickup
		}, function() {
			props.onClickShippingMethod( key, value, option );
		});
	},
	onSubmitShipping: function( event ) {
		var props = this.props;
		props.onSubmitShipping( event );
	},
	render: function() {
		var handleFields = this.handleFields;
		var handleWarehouses = this.handleWarehouses;
		var onSubmitShipping = this.onSubmitShipping;
		var props = this.props;
		var fields = handleFields( props.fields, props.shipping, props.po_number );
		var warehouses = handleWarehouses( props.warehouses );
		return <div className="shipping">
			{ fields }
			{ warehouses }
			<button className="button" onClick={ onSubmitShipping }>Next</button>
		</div>;
	}
});
module.exports = Shipping;