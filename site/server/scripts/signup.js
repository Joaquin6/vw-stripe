require( "../styles/signup.scss" );
require("../images/signup/customer-number.jpg");
(function() {
	console.log( "===== Closure =====" );
	window.addEventListener( "DOMContentLoaded", function( event ) {
		console.log( "===== DOMContentLoaded =====" );
		var form = document.querySelectorAll( ".signup-form" )[0];
		console.log( form );
		if( form ) {
			var formSubmit = form.querySelectorAll( ".submit input" )[0];
			var customerNumber = form.querySelectorAll( ".customer-number" )[0];
			var customerNumberCaption = customerNumber.querySelectorAll( ".caption" )[0];
			var customerNumberCaptionCTA = customerNumberCaption.querySelectorAll( ".cta" )[0];
			var customerNumberCaptionCTAImgClose = document.createElement( "span" );
			var customerNumberCaptionCTAImg = document.createElement( "img" );
			var loadingIndicator = document.createElement( "div" );
			var loadingIcon = document.createElement( "span" );
			var overlay = document.getElementById( "overlay" );
			var $overlay = $( overlay );
			var toggleLoading = function( event ) {
				if( !form.isLoading ) {
					form.isLoading = true;
					overlay.appendChild( loadingIndicator );
					$( "html, body" ).addClass( "no-scroll" );
					$overlay.addClass( "toggle" );
				}
				else {
					event.preventDefault();
				}
			};
			var togglePreventSubmit = function( event ) {
				if( form.isLoading ) {
					event.preventDefault();
				}
			};
			var onClickOverlay = function( event ) {
				$( "html, body" ).removeClass( "no-scroll" );
				$overlay.removeClass( "toggle" );
				overlay.removeChild( customerNumberCaptionCTAImgClose );
				overlay.removeChild( customerNumberCaptionCTAImg );
				overlay.removeEventListener( onClickOverlay );
			};
			loadingIndicator.className = "loading-indicator";
			loadingIcon.className = "loading-icon";
			loadingIndicator.appendChild( loadingIcon );
			customerNumberCaptionCTAImg.className = "customer-number-example";
			customerNumberCaptionCTAImg.src = "/img/signup/customer-number.jpg";
			customerNumberCaptionCTAImgClose.className = "customer-number-example-close";
			customerNumberCaptionCTAImgClose.innerHTML = "x";
			console.log( customerNumber );
			console.log( customerNumberCaption );
			console.log( customerNumberCaptionCTA );
			form.addEventListener( "submit", toggleLoading, false );
			formSubmit.addEventListener( "click", togglePreventSubmit, false );
			customerNumberCaptionCTAImg.addEventListener( "click", function( event ) {
				event.stopPropagation();
			}, false );
			customerNumberCaptionCTA.addEventListener( "click", function( event ) {
				overlay.appendChild( customerNumberCaptionCTAImgClose );
				overlay.appendChild( customerNumberCaptionCTAImg );
				$( "html, body" ).addClass( "no-scroll" );
				$overlay.addClass( "toggle" );
				overlay.addEventListener( "click", onClickOverlay, false );
			}, false );
			// remove loader on unload
			// window.addEventListener( "unload", function( event ) {
			// 	if( form.isLoading ) {
			// 		form.isLoading = false;
			// 		overlay.removeChild( loadingIndicator );
			// 		$( "html, body" ).removeClass( "no-scroll" );
			// 		$overlay.removeClass( "toggle" );
			// 	}
			// }, false );
		}
		console.log( "===== /DOMContentLoaded =====" );
	}, false );
	window.addEventListener( "load", function( event ) {
		console.log( "===== Load =====" );
		console.log( "===== /Load =====" );
	}, false );
	console.log( "===== /Closure =====" );
})();