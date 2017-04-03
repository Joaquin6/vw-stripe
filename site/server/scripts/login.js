require( "../styles/login.scss" );
(function() {
	console.log( "===== Closure =====" );
	window.addEventListener( "DOMContentLoaded", function( event ) {
		console.log( "===== DOMContentLoaded =====" );
		var login = document.getElementById( "login" );
		var form = login.querySelectorAll( "form" )[0];
		var submit = form.querySelectorAll( ".submit" )[0];
		var loadingIndicator = document.createElement( "div" );
		var loadingIcon = document.createElement( "span" );
		var overlay = document.getElementById( "overlay" );
		var $overlay = $( overlay );
		loadingIndicator.className = "loading-indicator";
		loadingIcon.className = "loading-icon";
		loadingIndicator.appendChild( loadingIcon );
		form.addEventListener( "submit", function( event ) {
			if( !form.isLoading ) {
				form.isLoading = true;
				overlay.appendChild( loadingIndicator );
				$( "html, body" ).addClass( "no-scroll" );
				$overlay.addClass( "toggle" );
			}
			else {
				event.preventDefault();
			}
		}, false );
		submit.addEventListener( "click", function( event ) {
			if( form.isLoading ) {
				event.preventDefault();
			}
		}, false );
		console.log( "===== /DOMContentLoaded =====" );
	}, false );
	window.addEventListener( "load", function( event ) {
		console.log( "===== Load =====" );
		console.log( "===== /Load =====" );
	}, false );
	console.log( "===== /Closure =====" );
})();