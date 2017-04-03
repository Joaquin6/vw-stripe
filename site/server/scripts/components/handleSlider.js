require( "slick-carousel" );
require( "slick-carousel/slick/slick.scss" );
var handleSlider = function( slider, options ) {
  var events = options.events;
  var settings = options.settings || {};
  var $slider = $( slider );
  if( events ) {
    var onAfterChange = events.afterChange;
    var onBeforeChange = events.beforeChange;
    var onBreakpoint = events.breakpoint;
    var onInit = events.init;
    var onSwipe = events.swipe;
    if( onAfterChange ) {
      $slider.on( "afterChange", onAfterChange );
    }
    if( onBeforeChange ) {
      $slider.on( "beforeChange", onBeforeChange );
    }
    if( onBreakpoint ) {
      $slider.on( "breakpoint", onBreakpoint );
    }
    if( onInit ) {
      $slider.on( "init", onInit );
    }
    if( onSwipe ) {
      $slider.on( "swipe", onSwipe );
    }
  }
  $slider.slick( settings );
  return $slider;
};
module.exports = handleSlider;