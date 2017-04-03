var selectmenu = require( "jquery-ui/ui/widgets/selectmenu" );
require( "jquery-ui/themes/base/selectmenu.css" );
var handleSelect = function( elements, options ) {
	var selectmenus;
	$.widget( "ui.selectmenu", $.ui.selectmenu, {
		_renderItem: function( ul, item ) {
			var wrapper = $( "<div>" );
			var li = $( "<li>" );
			
			var span = $( "<span class=\"copy\">" );
			if ( item.disabled ) {
				this._addClass( li, null, "ui-state-disabled" );
			}
			this._setText( span, item.label );
			return li.append( wrapper.append( span ) ).appendTo( ul );
		},
		_renderMenu: function( ul, items ) {
			var that = this;
			var ulEl = ul[0];
			var ulId = ulEl.id;
			var selectId = ulId.split( "-menu" )[0];
			var select = document.getElementById( selectId );
			$.each( items, function( index, item ) {
				that._renderItemData( ul, item );
			});
			$( ulEl.parentNode ).appendTo( select.parentNode );
		}
	});
	selectmenus = $( elements ).selectmenu({
		change: options && options.change ? options.change : function( event ) {
			console.log( "Error: missing options.change;" );
			console.log( event.target );
			console.log( event.target.value );
		}
	});
	return selectmenus;
};
module.exports = handleSelect;