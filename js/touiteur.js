var Touiteur_Utilities = (function(){

	var Json = (function(){
		var decode_rec = function(json_string, i, i_max, obj){

		};

		var decode = function(json_string){
			var res = {};
			var i_max = json_string.length;
			var i = 0;
			return res;
		};

		return {
			decode: decode
		}
	})();

	return {
		Json: Json
	}
})();

var Touiteur = (function(){

	var touiteur_api = "http://touiteur.3ie.fr/"
	var api = {
		signin: {
			url: touiteur_api + "api/user/login",
			req_type: "GET",
			res_type: "XML"
		},
		signup: {
			url: touiteur_api + "api/user/register",
			req_type: "POST",
			res_type: "XML"
		}
	};

	var screens = {
		signin: { container: "#screen-0", navbar: false },
		signup: { container: "#screen-1", navbar: false },
		home: { container: "#screen-2", navbar: true }
	};
	var screen_current;
	var screen_old = screens.signin;

	$navbar = $('#navbar');
	$signup = $('#touiteur-signup');
	$signin = $('#touiteur-signin');

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
		$.noty.basics.timeout = 2000;
		
		/*
		http://syddev.com/jquery.videoBG/index.html#documentation
		*/
		/*$('body').videoBG({
			position:"fixed",
			zIndex:-1,
			opacity:1,
			loop:true,
			scale:true,
			ogv:'img/background_video.ogv',
			mp4:'img/background_video.mp4',
			webm:'img/background_video.webm',
			poster:'img/paris.jpg'
		});
		*/

		var $container = $('.wall');
		// initialize
		$container.masonry({
		  columnWidth: 310,
		  itemSelector: '.wall-box',
		  gutter: 20,
		  isFitWidth: true
		});

		$signup.on('submit', function(e){
			e.preventDefault();
			$.ajax({
				type: api['signup']['req_type'],
				url:api['signup']['url'],
				data: {
					login: $(this).find('input[name=login]').val(),
					email: $(this).find('input[name=mail]').val(),
					password: $(this).find('input[name=password]').val()
				}
			}).done(function(data){
				notify('success', 'Successful Registration !');
				renderTab('signin');
			}).fail(function(data){
				notify('error', 'Registration failed, try again !');
			});
		});

		$signin.on('submit', function(e){
			e.preventDefault();
			$.ajax({
				type: api['signin']['req_type'],
				url:api['signin']['url'],
				data: {
					login: $(this).find('input[name=login]').val(),
					password: $(this).find('input[name=password]').val()
				}
			}).done(function(data){
				notify('success', 'Successful Authentication !');
				renderTab('home');
			}).fail(function(data){
				notify('error', 'Authentication Failed !');
				renderTab('home');
			});
		});
	};

	var renderTab = function(screen)
	{
		screen_old = screen_current;
		screen_current = screens[screen];
		if (screen_old != undefined)
			$(screen_old.container).hide();
		$(screen_current.container).show();
		if (screen_current.navbar)
			$navbar.show();
		else
			$navbar.hide();
	};

	var notify = function(type, msg, layout){
		if (layout == undefined)
			layout = "top";
		var n = noty({type:type, text: msg, layout:layout});
	}

	return {
		init: init
	}

})();


$(document).ready(function() { 
	initScreen = 'home';
	Touiteur.init(initScreen);
	console.log(Touiteur_Utilities.Json.decode('{ yo : "mama" }'));
});