var Touiteur = (function(){

	var screens = {
		signin: "#screen-0",
		signup: "#screen-1"
	};
	var screen_current;
	var screen_old = screens.signin;

	var init = function(screen){
		for (var s in screens)
			$(screens[s]).hide();
		initNav();
		initScreens();
		renderTab(screen);
	};

	var initNav = function()
	{
		$("[data-touiteur-goto]").on('click', function(){
			renderTab($(this).data('touiteur-goto'));
		});
	};

	var initScreens = function()
	{

	};

	var renderTab = function(screen)
	{
		screen_old = screen_current;
		screen_current = screens[screen];
		$(screen_old).hide();
		$(screen_current).show();
	};


	return {
		init: init
	}

})();


$(document).ready(function() { 
	initScreen = 'signin';
	Touiteur.init(initScreen); 


});