var React = require( "react" );
var ReactDOM = require( "react-dom" );
var LoadingIndicator = require( "../overlay/loadingIndicator" );
var handleSelect = require( "../handleSelect" );
var Filter = React.createClass({
	getInitialState: function() {
		var props = this.props;
		var hasWrapper = props.hasWrapper ? true : false;
		var filters = {
			accessory: { label: "Accessories", fields: [] },
			tire: { label: "Tires", fields: [] },
			wheel: { label: "Wheels", fields: [] }
		};
		var queries = {};
		for( var key in props.filters ) {
			filters[key].fields = props.filters[key];
			queries[key] = {};
		}
		console.log( filters );
		return {
			hasWrapper: hasWrapper,
			isLoading: false,
			toggle: !hasWrapper,
			filters: filters,
			part_number: "",
			queries: queries,
			type: "",
			types: [
				"wheel",
				"tire",
				"accessory"
			]
		};
	},
	componentDidMount: function() {
		var onChangeSelect = this.onChangeSelect;
		var state = this.state;
		var el = ReactDOM.findDOMNode( this );
		var selects = el.querySelectorAll( "select" );
		var selectmenus = handleSelect( selects, {
			change: onChangeSelect
		});
	},
	handleFilter: function() {
		var preventDefault = this.preventDefault;
		var toggleLoading = this.toggleLoading;
		var togglePreventSubmit = this.togglePreventSubmit;
		var state = this.state;
		var submit, render;
		render = state.types.map(function( type, index, array ) {
			var classNameFields = state.type === type ? `item-filter-form ${ type }` : `item-filter-form ${ type } hidden`;
			var hasQueries = false;
			var fields = [];
			var queryKeys = [];
			var classNameSubmit;
			for( var key in state.queries[type] ) {
				queryKeys.push( key );
			}
			hasQueries = queryKeys.length > 0 ? true : false;
			for( var key in state.filters[type].fields ) {
				var field = state.filters[type].fields[key];
				var hasQuery = state.queries[type][key] ? true : false;
				var classNameField = hasQuery ? "item-filter-field selected" : "item-filter-field";
				fields.push(
					<div className={ classNameField } key={ `filter-${ type }-field-${ key }` }>
						<select name={ key } defaultValue="default" value={ state.queries[type][key] }>
							<option value="default" disabled>{ field.label }</option>
							{
								field.values.map(function( value, index, array ) {
									return <option value={ value } key={ `filter-${ type }-field-${ key }-option-${ index + 1 }` }>{ value }</option>;
								})
							}
						</select>
					</div>
				);
			}
			classNameFields = hasQueries ? classNameFields + " has-selected" : classNameFields;
			submit = hasQueries ? <button type="submit" onClick={ togglePreventSubmit }>Search</button> : <button className="disabled" type="submit" onClick={ preventDefault }>Search</button>;
			return <form className={ classNameFields } method="GET" action="/search" key={ `filter-${ type }` } onSubmit={ hasQueries ? toggleLoading : preventDefault }>
				<input className="item-filter-type-field" name="type" type="text" value={ type } readOnly />
				<div className="item-filter-fields">{ fields }</div>
				<div className="item-filter-submit">{ submit }</div>
			</form>;
		});
		return render;
	},
	onChangePartNumber: function( event ) {
		var state = this.state;
		var target = event.target;
		var value = target.value;
		this.setState({
			part_number: value
		});
	},
	onChangeSelect: function( event ) {
		var state = this.state;
		var queries = state.queries;
		var target = event.target;
		var value = target.value;
		var name = target.getAttribute( "name" );
		console.log( "onChange" );
		if( state.type && value ) {
			if( value !== "default" ) {
				queries[state.type][name] = value;
			}
			else {
				delete queries[state.type][name];
			}
			this.setState({
				queries: queries
			});
		}
	},
	onClickRestart: function( event ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		var el = ReactDOM.findDOMNode( this );
		var selects = el.querySelectorAll( `.item-filter-form select` );
		var queries = {};
		$( selects ).val( "default" );
		$( selects ).selectmenu( "refresh" );
		for( var key in state.filters ) {
			queries[key] = {};
		}
		setState({
			queries: queries
		});
	},
	onClickToggle: function( event ) {
		var state = this.state;
		var toggle = state.toggle;
		this.setState({
			toggle: !toggle
		});
	},
	onClickType: function( type ) {
		console.log( "onClickType" );
		var state = this.state;
		this.setState({
			type: state.type !== type ? type : ""
		});
	},
	preventDefault: function( event ) {
		event.preventDefault();
	},
	toggleLoading: function( event ) {
		var setState = this.setState.bind( this );
		var state = this.state;
		if( !state.isLoading ) {
			var overlay = document.getElementById( "overlay" );
			var $overlay = $( overlay );
			$( "html, body" ).addClass( "no-scroll" );
			$overlay.addClass( "toggle" );
			ReactDOM.render( <LoadingIndicator />, overlay );
			setState({
				isLoading: true
			});
		}
		else {
			event.preventDefault();
		}
	},
	togglePreventSubmit: function( event ) {
		var state = this.state;
		if( state.isLoading ) {
			event.preventDefault();
		}
	},
	render: function() {
		var component = this;
		var handleFilter = this.handleFilter;
		var onChangePartNumber = this.onChangePartNumber;
		var onClickRestart = this.onClickRestart;
		var onClickToggle = this.onClickToggle;
		var onClickType = this.onClickType;
		var preventDefault = this.preventDefault;
		var toggleLoading = this.toggleLoading;
		var togglePreventSubmit = this.togglePreventSubmit;
		var state = this.state;
		var hasSelected = state.type ? true : false;
		var filter = handleFilter( state.type );
		var classNameWrapper = state.toggle ? "item-filter-wrapper toggle" : "item-filter-wrapper";
		var classNameItemFilterTypes = hasSelected ? "item-filter-types has-selected" : "item-filter-types";
		var classNameForms = state.type ? "item-filter-forms" : "item-filter-forms hidden";
		var submit = (state.part_number !== "") ? <button type="submit" onClick={ togglePreventSubmit }>Search</button> : <button className="disabled" type="submit" onClick={ preventDefault }>Search</button>;
		var itemFilter = <div className="item-filter">
			<div className={ classNameItemFilterTypes }>
				{
					state.types.map(function( type, index, array ) {
						var classNameType = (state.type === type) ? "item-filter-type selected" : "item-filter-type";
						return <div className={ classNameType } key={ `filter-type-${ index + 1 }` }>
							<span className="copy" onClick={ onClickType.bind( component, type ) }>{ state.filters[type].label }</span>
						</div>;
					})
				}
			</div>
			<div className={ classNameForms }>{ filter }</div>
			<span className="item-filter-restart" onClick={ onClickRestart }>Restart</span>
			<div className="item-filter-options">
				<span className="item-filter-options-cta">or search by:</span>
				<div className="item-filter-options-menu">
					<div className="item-filter-options-menu-item"><a className="button" href="/search">Specifications</a></div>
					<div className="item-filter-options-menu-item"><a className="button" href="/products">All Products</a></div>
				</div>
				<form className="item-filter-part_number-form" method="GET" action="/search" onSubmit={ state.part_number !== "" ? toggleLoading : preventDefault }>
					<input className="item-filter-part_number-field" name="part_number" type="text" placeholder="Enter our Part Number or Yours" onChange={ onChangePartNumber } />
					<div className="item-filter-part_number-submit">{ submit }</div>
				</form>
			</div>
		</div>;
		var render = state.hasWrapper ? <div className={ classNameWrapper }>
			<div className="item-filter-toggle">
				<span className="copy" onClick={ onClickToggle }>{ state.toggle ? "Hide Product Filter" : "Show Product Filter" }</span>
			</div>
			{ itemFilter }
		</div> : itemFilter;
		return render;
	}
});
module.exports = Filter;