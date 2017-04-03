var common = require( "./components/common" );
var handleSelect = require( "./components/handleSelect" );
require( "../styles/search.scss" );
(function() { 
	console.log( "===== Closure =====" );
	window.addEventListener( "DOMContentLoaded", function( event ) {
		console.log( "===== DOMContentLoaded =====" );
		var hash = window.location.hash;
		var forms = document.querySelectorAll( ".forms" )[0];
		var selectmenus;
		common();
		if( forms ) {
			var formList = forms.querySelectorAll( ".list" )[0];
			var formListItems = formList.querySelectorAll( "form" );
			var formTypes = document.querySelectorAll( ".form-types" )[0];
			var formTypeAccessory = formTypes.querySelectorAll( ".accessory" )[0];
			var formTypeTire = formTypes.querySelectorAll( ".tire" )[0];
			var formTypeWheel = formTypes.querySelectorAll( ".wheel" )[0];
			var loadingIndicator = document.createElement( "div" );
			var loadingIcon = document.createElement( "span" );
			var overlay = document.getElementById( "overlay" );
			var $overlay = $( overlay );
			var toggleFormType = function( type ) {
				var toggledType = formTypes.querySelectorAll( ".toggle" )[0];
				var targetFormType = formTypes.querySelectorAll( `.${ type }` )[0];
				var toggledForm = formList.querySelectorAll( ".toggle" )[0];
				var targetForm = formList.querySelectorAll( `.${ type }` )[0];
				var $targetFormType = $( targetFormType );
				var $targetForm = $( targetForm );
				if( toggledForm ) {
					$( toggledForm ).removeClass( "toggle" );
				}
				if( toggledType ) {
					$( toggledType ).removeClass( "toggle" );
				}
				$targetFormType.addClass( "toggle" );
				$targetForm.addClass( "toggle" );
				window.location.hash = type;
			};
			var toggleLoading = function( event ) {
				if( !forms.isLoading ) {
					forms.isLoading = true;
					overlay.appendChild( loadingIndicator );
					$( "html, body" ).addClass( "no-scroll" );
					$overlay.addClass( "toggle" );
				}
				else {
					event.preventDefault();
				}
			};
			var togglePreventSubmit = function( event ) {
				if( forms.isLoading ) {
					event.preventDefault();
				}
			};
			loadingIndicator.className = "loading-indicator";
			loadingIcon.className = "loading-icon";
			loadingIndicator.appendChild( loadingIcon );
			for( var a = 0; a < formListItems.length; a++ ) {
				var form = formListItems[a];
				var formSubmit = form.querySelectorAll( ".submit" )[0];
				var formReset = form.querySelectorAll( ".reset" )[0];
				var selects = form.querySelectorAll( "select" );
				console.log( selects );
				var selectmenus = handleSelect( selects, {
					change: function( event ) {
						var target = event.target;
						console.log( event.target );
						console.log( event.target.value );
					}
				});
				var resetSelectMenus = function( event ) {
					var selects = this;
					var $selects = $( selects );
					event.preventDefault();
					console.log( $selects );
					$selects.val( "" );
					$selects.selectmenu( "refresh" );
				}.bind( selects );
				form.addEventListener( "submit", toggleLoading, false );
				formSubmit.addEventListener( "click", togglePreventSubmit, false );
				formReset.addEventListener( "click", resetSelectMenus, false );
			}
			formTypeAccessory.addEventListener( "click", toggleFormType.bind( this, "accessory" ) );
			formTypeTire.addEventListener( "click", toggleFormType.bind( this, "tire" ) );
			formTypeWheel.addEventListener( "click", toggleFormType.bind( this, "wheel" ) );
			if( hash ) {
				var hashTarget = hash.split( "#" )[1];
				switch( hashTarget ) {
					case "accessory":
					case "tire":
					case "wheel":
						toggleFormType( hashTarget );
					break;
					default:
						toggleFormType( "wheel" );
					break;
				}
			}
			else {
				toggleFormType( "wheel" );
			}
		}
		console.log( "===== /DOMContentLoaded =====" );
	}, false );
	window.addEventListener( "load", function( event ) {
		console.log( "===== Load =====" );
		console.log( "===== /Load =====" );
	}, false );
	console.log( "===== /Closure =====" );
})();