require( "../styles/account.scss" );
var common = require( "./components/common" );
common();
//console.log("Account Page");

//super quick and dirty page spesific scripts

(function PayPurchaseOrderPage(){
	var containerPayPurchaseOrders = document.querySelectorAll( ".payPurchaseOrderContainer" )[0];
	if( containerPayPurchaseOrders ) {
		console.log("PayPurchaseOrderPage");
		console.log( containerPayPurchaseOrders.getAttribute( "data" ) );
		var payPurchaseOrderForm = containerPayPurchaseOrders.querySelectorAll( ".payPurchaseOrderForm" )[0];
		var payPurchaseOrderSelect = payPurchaseOrderForm.querySelectorAll( ".purchaseOrders" )[0];
		var payPurchaseOrderSubmit = payPurchaseOrderForm.querySelectorAll( ".submit" )[0];
		var payPurchaseOrderSuccess = containerPayPurchaseOrders.querySelectorAll( ".payPurchaseOrderSuccess" )[0];
		var payPurchaseOrderSuccessMessage = payPurchaseOrderSuccess.querySelectorAll( ".message" )[0];
		var payPurchaseOrderSuccessMessageCTA = payPurchaseOrderSuccessMessage.querySelectorAll( ".cta" )[0];
		var payPurchaseOrderSuccessDetails = payPurchaseOrderSuccess.querySelectorAll( ".details" )[0];
		var payPurchaseOrderSuccessOrderNumber = payPurchaseOrderSuccessDetails.querySelectorAll( ".orderNumber .value" )[0];
		var payPurchaseOrderSuccessDateCreated = payPurchaseOrderSuccessDetails.querySelectorAll( ".created .value" )[0];
		var payPurchaseOrderSuccessAddress = payPurchaseOrderSuccessDetails.querySelectorAll( ".address" )[0];
		var payPurchaseOrderSuccessAddressName = payPurchaseOrderSuccessAddress.querySelectorAll( ".name" )[0];
		var payPurchaseOrderSuccessAddress_1 = payPurchaseOrderSuccessAddress.querySelectorAll( ".address_1" )[0];
		var payPurchaseOrderSuccessAddress_2 = payPurchaseOrderSuccessAddress.querySelectorAll( ".address_2" )[0];
		var payPurchaseOrderSuccessAddressCityStatePostal = payPurchaseOrderSuccessAddress.querySelectorAll( ".city-state-postal" )[0];
		var payPurchaseOrderSuccessTotal = payPurchaseOrderSuccessDetails.querySelectorAll( ".total .value" )[0];
		var purhcaseOrderData = JSON.parse( payPurchaseOrderSelect.getAttribute( "data" ) );
		var purchaseOrders = {};
		var currentPurchaseOrder, result, error;
		var loadingIndicator = document.createElement( "div" );
		var loadingIcon = document.createElement( "span" );
		var overlay = document.getElementById( "overlay" );
		var $overlay = $( overlay );
		var toggleLoading = function( event ) {
			if( !payPurchaseOrderForm.isLoading ) {
				payPurchaseOrderForm.isLoading = true;
				overlay.appendChild( loadingIndicator );
				$( "html, body" ).addClass( "no-scroll" );
				$overlay.addClass( "toggle" );
			}
			else {
				event.preventDefault();
			}
		};
		var onSubmitStripe = function() {
			console.log( "submit" );
			console.log( purchaseOrders[currentPurchaseOrder] );
			$.ajax({
				method: "POST",
				url: "/account/pay-purchase-order",
				dataType: "json",
				data: { saleId: purchaseOrders[currentPurchaseOrder].data.id },
				success: function( response ) {
					result = response;
				},
				error: function( response ) {
					error = response;
				},
				complete: function() {
					if( !error ) {
						console.log( result );
						payPurchaseOrderSuccessOrderNumber.innerHTML = purchaseOrders[currentPurchaseOrder].id;
						payPurchaseOrderSuccessDateCreated.innerHTML = new Date( purchaseOrders[currentPurchaseOrder].created ).toLocaleString( "en-US", {
							day: "numeric",
							hour: "numeric",
							minute: "numeric",
							month: "long",
							weekday: "long",
							year: "numeric"
						});
						payPurchaseOrderSuccessAddressName.innerHTML = purchaseOrders[currentPurchaseOrder].name;
						payPurchaseOrderSuccessAddress_1.innerHTML = purchaseOrders[currentPurchaseOrder].address.address_1;
						payPurchaseOrderSuccessAddress_2.innerHTML = purchaseOrders[currentPurchaseOrder].address.address_2;
						payPurchaseOrderSuccessAddressCityStatePostal.innerHTML = `${ purchaseOrders[currentPurchaseOrder].address.city }, ${ purchaseOrders[currentPurchaseOrder].address.state } ${ purchaseOrders[currentPurchaseOrder].address.zip }`;
						payPurchaseOrderSuccessTotal.innerHTML = purchaseOrders[currentPurchaseOrder].total;
						if( !purchaseOrders[currentPurchaseOrder].address.address_2 ) {
							$( payPurchaseOrderSuccessAddress_2 ).addClass( "hidden" );
						}
						else if( $( payPurchaseOrderSuccessAddress_2 ).hasClass( "hidden" ) ) {
							$( payPurchaseOrderSuccessAddress_2 ).removeClass( "hidden" );
						}
						$( payPurchaseOrderForm ).addClass( "hidden" );
						$( payPurchaseOrderSuccess ).removeClass( "hidden" );
					}
					else {
						console.log( error );
					}
					payPurchaseOrderForm.isLoading = false;
					overlay.removeChild( loadingIndicator );
					$( "html, body" ).removeClass( "no-scroll" );
					$overlay.removeClass( "toggle" );
				}
			});
			toggleLoading();
		};
		var StripeHandler = StripeCheckout.configure({
			key: containerPayPurchaseOrders.getAttribute( "data" ),
			currency: "usd",
			image: "/img/checkout/VWheelLogo-Gray-01.png",
			locale: "auto",
			token: onSubmitStripe
		});
		purhcaseOrderData.forEach(function( purchaseOrder, index, array ) {
			purchaseOrders[purchaseOrder.id] = purchaseOrder;
		});
		payPurchaseOrderSelect.addEventListener( "change", function( event ) {
			var target = event.target;
			var value = target.value;
			if( purchaseOrders[value] ) {
				var total = purchaseOrders[value].total;
				var $payPurchaseOrderSubmit = $( payPurchaseOrderSubmit );
				currentPurchaseOrder = value;
				if( $payPurchaseOrderSubmit.hasClass( "disabled" ) ) {
					$payPurchaseOrderSubmit.removeClass( "disabled" );
				}
				console.log( purchaseOrders[value] );
				console.log( value );
				console.log( total );
			}
		}, false );
		payPurchaseOrderSubmit.addEventListener( "click", function( event ) {
			event.preventDefault();
			if( currentPurchaseOrder && !payPurchaseOrderForm.isLoading ) {
				let moneyToFloat = str => { return str ? Number( str.replace( /[^0-9\.]+/g, "" ) ) : str; };
				let paymentTotal = moneyToFloat( purchaseOrders[currentPurchaseOrder].total );
				StripeHandler.open({
					name: "Vision Wheel, Inc.",
					description: "Est. 1976 Custom Wheel Manufacturer",
					amount: paymentTotal * 100
				});
			}
		}, false );
		payPurchaseOrderSuccessMessageCTA.addEventListener( "click", function( event ) {
			window.print();
		}, false );
	}
})();

(function ProfilePage(){
	var profileContainer = document.querySelectorAll( ".profileContainer" )[0];
	if( profileContainer ) {
		var $userProfileContainer = $(".userProfileContainer");
		var $userProfileEditContainer = $(".userProfileEditContainer");
		if( $userProfileContainer.length > 0 && $userProfileEditContainer.length > 0 ) {
			console.log("ProfilePage");
			var userProfileContainer = profileContainer.querySelectorAll( ".userProfileContainer" )[0];
			var userProfileEditContainer = profileContainer.querySelectorAll( ".userProfileEditContainer" )[0];
			var userProfileEditForm = userProfileEditContainer.querySelectorAll( "form" )[0];
			var userProfileEditSubmit = userProfileEditForm.querySelectorAll( ".submit" )[0];
			var userSalesRepContainer = profileContainer.querySelectorAll( ".userSalesRepContainer" )[0];
			var userSalesRepForm = userSalesRepContainer.querySelectorAll( "form" )[0];
			var userSalesRepSubmit = userSalesRepForm.querySelectorAll( ".submit" )[0];
			var userPasswordUpdateContainer = profileContainer.querySelectorAll( ".userPasswordUpdateContainer" )[0];
			var userPasswordUpdateForm = userPasswordUpdateContainer.querySelectorAll( "form" )[0];
			var userPasswordUpdateSubmit = userPasswordUpdateForm.querySelectorAll( ".submit" )[0];
			var loadingIndicator = document.createElement( "div" );
			var loadingIcon = document.createElement( "span" );
			var overlay = document.getElementById( "overlay" );
			var $overlay = $( overlay );
			var toggleLoading = function( event ) {
				if( !profileContainer.isLoading ) {
					profileContainer.isLoading = true;
					overlay.appendChild( loadingIndicator );
					$( "html, body" ).addClass( "no-scroll" );
					$overlay.addClass( "toggle" );
				}
				else {
					event.preventDefault();
				}
			};
			var togglePreventSubmit = function( event ) {
				if( profileContainer.isLoading ) {
					event.preventDefault();
				}
			};
			loadingIndicator.className = "loading-indicator";
			loadingIcon.className = "loading-icon";
			loadingIndicator.appendChild( loadingIcon );
			userProfileEditForm.addEventListener( "submit", toggleLoading, false );
			userProfileEditSubmit.addEventListener( "click", togglePreventSubmit, false );
			userSalesRepForm.addEventListener( "submit", toggleLoading, false );
			userSalesRepSubmit.addEventListener( "click", togglePreventSubmit, false );
			userPasswordUpdateForm.addEventListener( "submit", toggleLoading, false );
			userPasswordUpdateSubmit.addEventListener( "click", togglePreventSubmit, false );
			$(".editBtn", $userProfileContainer).click(function(){
				$userProfileContainer.hide();
				$userProfileEditContainer.show();
			});
		}
	}
})();

(function ContactPage(){
	var contentContainer = document.getElementById( "contentContainer" );
	var $commentFormContainer = $(".commentFormContainer");
	if ($commentFormContainer.length>0){
		var commentFormContainer = contentContainer.querySelectorAll( ".commentFormContainer" )[0];
		var commentForm = contentContainer.querySelectorAll( "form" )[0];
		var commentFormSubmit = commentForm.querySelectorAll( ".submit" )[0];
		var loadingIndicator = document.createElement( "div" );
		var loadingIcon = document.createElement( "span" );
		var overlay = document.getElementById( "overlay" );
		var $overlay = $( overlay );
		var toggleLoading = function( event ) {
			if( !commentForm.isLoading ) {
				commentForm.isLoading = true;
				overlay.appendChild( loadingIndicator );
				$( "html, body" ).addClass( "no-scroll" );
				$overlay.addClass( "toggle" );
			}
			else {
				event.preventDefault();
			}
		};
		var togglePreventSubmit = function( event ) {
			if( commentForm.isLoading ) {
				event.preventDefault();
			}
		};
		loadingIndicator.className = "loading-indicator";
		loadingIcon.className = "loading-icon";
		loadingIndicator.appendChild( loadingIcon );
		commentForm.addEventListener( "submit", toggleLoading, false );
		commentFormSubmit.addEventListener( "click", togglePreventSubmit, false );
		console.log("Contact");
	}
})();

(function OrderHistory(){
	var $orderSelector = $('#orderSelector');
	if ($orderSelector.length>0){
		console.log('orderSelectorContaine');
		$orderSelector.change(function(e){
			$('.order').hide();
			$('.order:eq('+this.value+')').show();
			console.log(this);
		});
	}
})();