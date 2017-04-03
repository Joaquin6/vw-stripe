var React = require( "react" );
var ReactDOM = require( "react-dom" );
var common = require( "./components/common" );
var handleSlider = require("./components/handleSlider");
var ItemSelector = require( "./components/product" );
require( "../styles/product.scss" );
(function() {
	console.log( "===== Closure =====" );
	var primaryHeader = document.querySelectorAll( "header.primary" )[0];
	var props = document.getElementById( "props" );
	var part_number = props.getAttribute( "part_number" );
	var product = JSON.parse( props.getAttribute( "product" ) );
	var warehouses = JSON.parse( props.getAttribute( "warehouses" ) );
	window.addEventListener( "DOMContentLoaded", function( event ) {
		console.log( "===== DOMContentLoaded =====" );
		var container = document.getElementById( "item-selector" );
		var header = document.querySelectorAll( ".header" )[0];
		var slider = header.querySelectorAll( ".slider" )[0];
		var sliderNext = slider.querySelectorAll( ".slider-next" )[0];
		var sliderPrev = slider.querySelectorAll( ".slider-prev" )[0];
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
				},
				init: function( event, slick ) {
					console.log( "init" );
				},
				swipe: function( event, slick, direction ) {
					console.log( "swipe" );
				}
			},
			settings: {
				dots: true,
				infinite: true,
				nextArrow: sliderNext,
				prevArrow: sliderPrev,
				responsive: [],
				slide: ".slide",
				slidesToShow: 1
			}
		};
		var $slider = handleSlider( slider, options );
		common();
		ReactDOM.render( <ItemSelector part_number={ part_number } product={ product } warehouses={ warehouses } />, container, function() {
			console.log( "render item selector" );
		});
		console.log( "===== /DOMContentLoaded =====" );
	}, false );
	window.addEventListener( "load", function( event ) {
		console.log( "===== Load =====" );
		if( part_number ) {
			var items = document.querySelectorAll( ".section.items" )[0];
			var table = items.querySelectorAll( ".table" )[0];
			var rect = table.getBoundingClientRect();
			var bottom = rect.bottom;
			console.log( items );
			console.log( table );
			console.log( rect );
			console.log( bottom );
			$( "html, body" ).animate({
				scrollTop: window.scrollY + bottom - primaryHeader.offsetHeight
			}, 300 );
		}
		console.log( "===== /Load =====" );
	}, false );
	console.log( "===== /Closure =====" );
})();