var wrapper = document.getElementById( "wrapper" );
var header = document.querySelectorAll( "header.primary" )[0];
var nav = document.querySelectorAll( "nav.primary" )[0];
var toggleNav = document.querySelectorAll( ".toggle-nav" );
var expandables = document.querySelectorAll( "li.expand" );
var sectionables = document.querySelectorAll( "li.section" );
var sectionableScreens =  document.querySelectorAll( ".sectionable" );
var $nav = $( nav );
var $toggleNav = $( toggleNav );
var tolist = function(nodelist){ return Array.prototype.slice.call(nodelist);}

var stopPropagation = function( event ) {
	event.stopPropagation();
};

var clickToggleNav = function( event ) {
	stopPropagation( event );
	if( $nav.hasClass( "active" ) ) {
		$toggleNav.removeClass( "active" );
		$nav.removeClass( "active" );
		wrapper.removeEventListener( "click", clickToggleNav, false );
	}
	else {
		$toggleNav.addClass( "active" );
		$nav.addClass( "active" );
		wrapper.addEventListener( "click", clickToggleNav, false );
	}
};


var Expandable = function(elm) {
	var self = this;
	this.elm = $(elm);
	this.expandable = $(elm.querySelector('ul.expandable'));
	elm.querySelector('span').addEventListener( "click", function(event){
		self.elm.toggleClass('active');
		self.expandable.toggleClass('active');
	}, false );
}

var Sectionable = function(elm) {
	var self = this;
	console.log("elm?",elm);
	this.sectionable = elm.querySelector('.sectionable');
	this.backBtn = this.sectionable.querySelector('p.back');
	this.navContainer = nav.querySelector(".links");
	$nav.append(this.sectionable);
	elm.querySelector('span').addEventListener( "click", function(event){
		$(self.sectionable).addClass('active');
		self.navContainer.style.height = $(self.sectionable).height()+"px";
	}, false );
	this.backBtn.addEventListener( "click", function(event){
		$(self.sectionable).removeClass('active');
		self.navContainer.style.height = "";
	}, false );
}

var handleNav = function() {
	tolist(sectionables).forEach(function(section){
		new Sectionable(section); 
	});
	tolist(expandables).forEach(function(expandable){
		new Expandable(expandable); 
	});
	tolist(toggleNav).forEach(function(nav){
		nav.addEventListener( "click", clickToggleNav, false );
	});
	
	header.addEventListener( "click", stopPropagation, false );
	nav.addEventListener( "click", stopPropagation, false );
};
module.exports = handleNav;