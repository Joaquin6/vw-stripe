var common = require( "./components/common" );
var handleFilter = require( "./components/handleFilter" );
var handleSlider = require("./components/handleSlider");
require( "../styles/products.scss" );
require("../images/products/ShopAll_Tires_ATV.jpg");
require("../images/products/ShopAll_Tires_GOLF.jpg");
require("../images/products/ShopAll_Tires_LG.jpg");
require("../images/products/ShopAll_Wheels_AM.jpg");
require("../images/products/ShopAll_Wheels_Milanni.jpg");
require("../images/products/ShopAll_Wheels_OffRoad.jpg");
(function() {
	console.log( "===== Closure =====" );
	window.addEventListener( "DOMContentLoaded", function( event ) {
		console.log( "===== DOMContentLoaded =====" );
    var filter = document.querySelectorAll( ".filter" )[0];
    var filters = filter.getAttribute( "data" );
    var slider = document.querySelectorAll( ".slider" )[0];
    var sliderNext = document.querySelectorAll( ".slider-next" )[0];
    var sliderPrev = document.querySelectorAll( ".slider-prev" )[0];
    var options = {
      events: {
        afterChange: function( event, slick, currentSlide ) {
          console.log( "afterChange" );
        },
        beforeChange: function( event, slick, currentSlide, nextSlide ) {
          console.log( "beforeChange" );
        },
        breakpoint: function( event, slick, breakpoint ) {
          console.log( "breakpoint" );
          console.log( breakpoint );
        },
        init: function( event, slick ) {
          console.log( "init" );
        },
        swipe: function( event, slick, direction ) {
          console.log( "swipe" );
        }
      },
      settings: {
        infinite: false,
        nextArrow: sliderNext,
        prevArrow: sliderPrev,
        responsive: [],
        slide: ".slide",
        slidesToShow: 1
      }
    };
		var $slider, filtersJSON;
    $slider = handleSlider( slider, options );
    common();
    try {
      filtersJSON = JSON.parse( filters );
      handleFilter( filter, filtersJSON, true );
    }
    catch( error ) {
      console.log( "Error: missing filters;" );
      console.log( error );
    }
		console.log( "===== /DOMContentLoaded =====" );
	}, false );
	window.addEventListener( "load", function( event ) {
		console.log( "===== Load =====" );
		console.log( "===== /Load =====" );
	}, false );
	console.log( "===== /Closure =====" );
})();