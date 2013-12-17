var Touiteur = (function(){

	var touiteur_api = "http://touiteur.3ie.fr/";
	var api = {
		signin: {
			url: touiteur_api + "api/user/login",
			req_type: "GET",
			res_type: "text" // XML
		},
		signup: {
			url: touiteur_api + "api/user/register",
			req_type: "POST",
			res_type: "text" // XML
		},
		user_details: {
			url: touiteur_api + "api/user/details",
			req_type: "GET",
			res_type: "text" // JSON
		},
		public_touites: {
			url: touiteur_api + "api/touite/get_publics",
			req_type: "GET",
			res_type: "text" // JSON
		}
	};

	var screens = {
		signin: { container: "#screen-0", navbar: false },
		signin_new: { container: "#screen-0", navbar: false },
		signup: { container: "#screen-1", navbar: false },
		home: { container: "#screen-2", navbar: true },
		post: { container: "#screen-3", navbar: true }
	};
	var screen_current;
	var screen_old = screens.signin;

	$post_content = $('#post_content');
	$post_touite = $('#post_touite');
	$wall_touites = $('#screen-2');
	$navbar = $('#navbar');
	$signup = $('#touiteur-signup');
	$signin = $('#touiteur-signin');

	var init = function(screen){
		for (var s in screens)
			$(screens[s]).hide();
		initNav();
		initScreens();
		renderTab(screen);
	}

	var initNav = function()
	{
		$("[data-touiteur-goto]").on('click', function(){
			renderTab($(this).data('touiteur-goto'));
		});
	}

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

		// initialize
		$wall_touites.masonry({
		  columnWidth: 300,
		  itemSelector: '.wall-box',
		  gutter: 30,
		  isFitWidth: true,
		  isInitLayout: false
		});
		
		$signup.on('submit', function(e){
			e.preventDefault();
			$.ajax({
				type: api['signup']['req_type'],
				url: api['signup']['url'],
				dataType: api['signup']['res_type'],
				data: {
					login: $(this).find('input[name=login]').val(),
					mail: $(this).find('input[name=mail]').val(),
					password: $(this).find('input[name=password]').val()
				}
			}).done(function(data){
				var obj = Touiteur_Utilities.Xml.decode(data);
				console.log(data);
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
				url: api['signin']['url'],
				dataType: api['signup']['res_type'],
				data: {
					login: $(this).find('input[name=login]').val(),
					password: $(this).find('input[name=password]').val()
				}
			}).done(function(data){
				var res = Touiteur_Utilities.Xml.decode(data);
				$.cookie('touiteur_token', res.root.data.user.token, { expires: 31 });
				sync_user_details(res.root.data.user.id);
				notify('success', 'Successful Authentication !');
				renderTab('home');
			}).fail(function(data){
				notify('error', 'Authentication Failed !');
			});
		});

		$post_touite.charCounter(144,{container: "#poste_counter"});
	}

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
		switch (screen)
		{
			case "signin":
				$.removeCookie('touiteur_token');
				var user_infos = get_user_details();
				if (user_infos)
				{
					$signin.find(".profile-name").html(user_infos[1]).show();
					$signin.find(".profile-email").html(user_infos[2]).show();
					$signin.find("input[name=login]").val(user_infos[1]).hide();
					$signin.find("input[name=password]").val("");
					$signin.find('[data-touiteur-goto=signin_new]').show();
				}
				else
				{
					$signin.find('[data-touiteur-goto=signin_new]').hide();
					$signin.find("input[name=login]").val("").show();
					$signin.find("input[name=password]").val("");
					$signin.find(".profile-name").hide();
					$signin.find(".profile-email").hide();
				}
				break;
			case "signin_new":
				$.removeCookie('touiteur_token');
				$.removeCookie('touiteur_user');
				renderTab('signin');
				break;
			case "home":
				$.ajax({
					type: api['public_touites']['req_type'],
					url: api['public_touites']['url'],
					dataType: api['public_touites']['res_type'],
					data: {
						token: $.cookie('touiteur_token'),
						item_by_page: 10,
						page: 1
					}
				}).done(function(data){
					var res = Touiteur_Utilities.Json.decode(data);
					console.log(res);
					$wall_touites.html('');
					var t = res.data.tweets;
					for (p in t)
					{
						$wall_touites.append(
							'<div class="wall-box">'+
			                	'<blockquote>' +
			                      '<p>' + t[p].content + '</p>' +
			                      '<small>By <span class="text-danger">' + t[p].author_login + '</span> <span class="text-info">Monday, 12am</span></small>' +
			                    '</blockquote>' +
			                    '<img src="img/touites/t0.jpg" class="img-thumbnail">' +
			                '</div>'
			                );
					}
					$wall_touites.data('masonry').layout();
				}).fail(function(data){
					notify('error', 'Error while Fetching Public Touites !');
				});
			break;
			case "post":
    			
			break;
		}
	}

	var get_user_details = function(){
		var user_infos = $.cookie('touiteur_user');
		if (user_infos)
			return user_infos.split("#!#!#!", 5);
		return undefined;
	}

	var sync_user_details = function(id){
		$.ajax({
			type: api['user_details']['req_type'],
			url: api['user_details']['url'],
			dataType: api['user_details']['res_type'],
			data: {
				user_id: id,
				token: $.cookie('touiteur_token')
			}
		}).done(function(data){
			var res = Touiteur_Utilities.Json.decode(data);
			console.log(res);
			$.cookie(
				'touiteur_user',
				res.data.user.id + "#!#!#!" +
				res.data.user.login + "#!#!#!" +
				res.data.user.mail + "#!#!#!" +
				res.data.user.register_date + "#!#!#!" +
				res.data.user.description,
				{ expires: 31 }
			);
		}).fail(function(data){
			notify('error', 'Error while Fetching User Details !');
		});
	}

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
	touiteur_debug = false;
	initScreen = 'signin';
	Touiteur.init(initScreen);
	//console.log(Touiteur_Utilities.Json.decode('{yo:{yo2:{yo3:"mama"},imad:"yeah"}}'));
	touiteur_debug = true;
	//console.log(Touiteur_Utilities.Json.decode('{"api_version":"1.0","success":true,"message":"","data":{"tweets":[{"content":"Go dodo..","date":1387240854},{"content":"Go dodo..","date":1387240854}]}'));
	//console.log(Touiteur_Utilities.Json.decode('[{"content":"Go dodo..","date":1387240854},{"content":"Go dodo..","date":1387240854},{"content":"Go dodo..","date":1387240854}]'));
	//console.log(Touiteur_Utilities.Xml.decode('<yo>qsd</yo><yo2>mama</yo2><yo6><yo4><yo3><imad>mama</imad></yo3></yo4></yo6><yo5><![CDATA[yeah]]></yo5><yo10><yo9>qsd</yo9></yo10>'));
	//console.log(Touiteur_Utilities.Xml.decode('<?xml version="1.0" encoding="utf-8"?><root><api_version><![CDATA[1ffcb886de03e1d984e81e210febdef2]]></api_version><success>true</success><message></message><data><user><id>37</id><token>qsdqsd</token></user></data></root>'));
});