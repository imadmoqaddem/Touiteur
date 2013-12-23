var Touiteur = (function(){

	var touiteur_api = "http://touiteur.3ie.fr/";
	var touiteur_img_dir = touiteur_api + "content/upload/";
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
		},
		user_touites: {
			url: touiteur_api + "api/touite/get_user_stream",
			req_type: "GET",
			res_type: "text" // JSON
		},
		user_follow: {
			url: touiteur_api + "api/user/follow",
			req_type: "POST",
			res_type: "text" // JSON
		},
		user_unfollow: {
			url: touiteur_api + "api/user/unfollow",
			req_type: "POST",
			res_type: "text" // JSON
		},
		user_followed: {
			url: touiteur_api + "api/user/followed",
			req_type: "GET",
			res_type: "text" // JSON
		},
		user_followers: {
			url: touiteur_api + "api/user/followers",
			req_type: "GET",
			res_type: "text" // JSON
		},
		user_list: {
			url: touiteur_api + "api/user/list",
			req_type: "GET",
			res_type: "text" // JSON
		},
		submit_touite: {
			url: touiteur_api + "api/touite/submit",
			req_type: "POST",
			res_type: "text" // JSON
		}
	};

	var screens = {
		signin: { container: "#screen-0", navbar: false },
		signin_new: { container: "#screen-0", navbar: false },
		signup: { container: "#screen-1", navbar: false },
		home: { container: "#screen-2", navbar: true },
		post: { container: "#screen-3", navbar: true },
		profile: { container: "#screen-4", navbar: true }
	};
	var screen_current;
	var screen_old = screens.signin;

	$post_content = $('#post_content');
	$submit_touite = $('#touiteur_submit');
	$wall_touites = $('#screen-2-wall');
	$load_more_touites = $('#load-more-touites');
	$touite_add_location = $('#touite_add_location');
	$map = $("#map-container");
	
	wall_refresh_id = 0;
	touites_first_id = -1;
	touites_last_id = -1;
	touites_page_nb_items = 10;
	touites_page = 1;

	$wall_usertouites = $('#screen-4-wall');
	$load_more_usertouites = $('#load-more-usertouites');
	wall_refresh_id_user = 0;
	touites_first_id_user = -1;
	touites_last_id_user = -1;
	touites_page_nb_items_user = 10;
	touites_page_user = 1;
	
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
		$("body").on('click', '[data-touiteur-goto]', function(e){
			var screen = $(this).data('touiteur-goto');
			if (screen == "profile")
				renderTab(screen, { id: $(this).data('touiteur-profile') });
			else
				renderTab(screen);
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
		$("[data-toggle=tooltip]").tooltip();

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

		$load_more_touites.on('click', function(e){
			e.preventDefault();
			touites_page++;
			load_touites(undefined, function(){
				$(window).scrollTo($load_more_touites, 100);
				$('html, body').scrollTo($load_more_touites, 100);
			});
		});

		$load_more_usertouites.on('click', function(e){
			e.preventDefault();
			touites_page_user++;
			load_touites_user(undefined, function(){
				$(window).scrollTo($load_more_usertouites, 100);
				$('html, body').scrollTo($load_more_usertouites, 100);
			});
		});

		$submit_touite.find('textarea[name=touite]').charCounter(140,{container: "#poste_counter"});
		$('#fileupload').fileupload({
		    dataType: 'text',
		    forceIframeTransport: true,
		    url: api['submit_touite']['url'],
		    acceptFileTypes: /(\.|\/)(jpe?g|png)$/i,
		    formData: function(){
				return [{
						name: 'token',
						value: $.cookie('touiteur_token')
					},
					{
						name: 'content',
						value: $submit_touite.find('textarea[name=touite]').val()
					}];
			},
	        add: function (e, data) {
	        	$submit_touite.off('submit.touiteur');
	            data.context = $submit_touite.on('submit.touiteur', function(e){
	                    e.preventDefault();
	           	        data.submit();
	                });
	        },
	        done: function (e, data) {
	        	$submit_touite.off('submit.touiteur');
	        	notify('success', 'Touite Successfully Posted !');
				$submit_touite.on('submit.touiteur', submitSimpleTouite);
				renderTab('home');
	        },
	        fail: function (e, data) {
	            notify('error', 'Error while Posting your Touite !');
	        },
	        always: function (e, data) {
	        }
		});
		
		$('body').on('click', '[data-touiteur-action=answer]', function(){
			alert('Click');
		});
		
		$submit_touite.on('submit.touiteur', submitSimpleTouite);
		$touite_add_location.on('click', function(){
			getUserPosition();
		});

		$("[data-touiteur-action=unfollow]").click(function(e){
			var id = $(this).data('touiteur-param');
			e.preventDefault();
			$.ajax({
				type: api['user_unfollow']['req_type'],
				url: api['user_unfollow']['url'],
				dataType: api['user_unfollow']['res_type'],
				data: {
					token: $.cookie('touiteur_token'),
					followed_id: id
				}
			}).done(function(data){
				notify('success', 'Unfollow Registered !');
			}).fail(function(data){
	            notify('error', 'Error while Registering Unfollow, try again later !');
			});
		});

		$("[data-touiteur-action=follow]").click(function(e){
			var id = $(this).data('touiteur-param');
			e.preventDefault();
			$.ajax({
				type: api['user_follow']['req_type'],
				url: api['user_follow']['url'],
				dataType: api['user_follow']['res_type'],
				data: {
					token: $.cookie('touiteur_token'),
					followed_id: id
				}
			}).done(function(data){
				notify('success', 'Follow Registered !');
			}).fail(function(data){
	            notify('error', 'Error while Registering Follow, try again later !');
			});
		});

	}

	var submitSimpleTouite = function(e){
		e.preventDefault();
		$.ajax({
			type: api['submit_touite']['req_type'],
			url: api['submit_touite']['url'],
			dataType: api['submit_touite']['res_type'],
			data: {
				token: $.cookie('touiteur_token'),
				content: $submit_touite.find('textarea[name=touite]').val()
			}
		}).done(function(data){
			notify('success', 'Touite Successfully Posted !');
			renderTab('home');
		}).fail(function(data){
            notify('error', 'Error while Posting your Touite !');
		});
	}

	var renderTab = function(screen, params)
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
		if (screen != "home")
			clearInterval(wall_refresh_id);
		if (screen != "profile")
			clearInterval(wall_refresh_id_user);
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
				load_touites('new');
				clearInterval(wall_refresh_id);
				wall_refresh_id = setInterval(function(){
					load_touites('new');
				}, 30 * 1000);
			break;
			case "post":
				$submit_touite.find('textarea[name=touite]').val('');
			break;
			case "profile":
				wall_refresh_id_user = 0;
				touites_first_id_user = -1;
				touites_last_id_user = -1;
				touites_page_nb_items_user = 10;
				touites_page_user = 1;
				$wall_usertouites.html('');
				$.ajax({
					type: api['user_details']['req_type'],
					url: api['user_details']['url'],
					dataType: api['user_details']['res_type'],
					data: {
						user_id: params.id,
						token: $.cookie('touiteur_token')
					}
				}).done(function(data){
					var r = Touiteur_Utilities.Json.decode(data);
					user = r.data.user;
					$("#user-name").html("<span class='text-primary'>" + user.login + "</span>");
					$("#user-id").html(user.id);
					$("#user-desc").html(user.description);
					$("#user-mail").html(user.mail);
					var date = new Date(parseInt(user.register_date) * 1000);
					var date_str = $.format.date(date, "dd/MM/yyyy");
					$('#user-register').html(date_str);
					load_touites_user('new');
					clearInterval(wall_refresh_id_user);
					wall_refresh_id_user = setInterval(function(){
						load_touites_user('new');
					}, 30 * 1000);
				}).fail(function(data){
					notify('error', 'Error while Fetching User Details !');
				});
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

	var load_touites = function(new_touites, callback){
		$.ajax({
			type: api['public_touites']['req_type'],
			url: api['public_touites']['url'],
			dataType: api['public_touites']['res_type'],
			data: {
				token: $.cookie('touiteur_token'),
				item_by_page: touites_page_nb_items,
				page: (new_touites != undefined) ? 1 : touites_page
			}
		}).done(function(data){
			var res = Touiteur_Utilities.Json.decode(data);
			var t = res.data.tweets;
			var boxes = "";
			var first_id = Infinity;
			var last_id = -1;
			var nb_touites = res.length;
			console.warn(nb_touites);
			for (p in t)
			{
				if (first_id == Infinity)
					first_id = parseInt(t[p].id);
				last_id = parseInt(t[p].id);
				if (new_touites != undefined)
				{
					if (last_id <= touites_first_id)
						break;
				}
				else if (last_id >= touites_last_id)
					continue;
				var date = new Date(parseInt(t[p].date) * 1000);
				var now = new Date();
				var date_str = $.format.prettyDate((date < now) ? date : now);
				boxes +=
					'<div class="wall-box">'+
	                	'<blockquote>' +
	                      '<p>' + t[p].content + '</p>' +
	                      '<div class="pull-left"><small>By <a href="#" data-touiteur-goto="profile" data-touiteur-profile="' + t[p].author_id + '" class="text-danger">' + 
	                      t[p].author_login + '</a> '+
	                      '<span class="text-info">' + date_str + '</span></small></div>' +
	                      '<button class="pull-right btn btn-xs btn-warning data-touiteur-action="answer"><span class="glyphicon glyphicon-share-alt"></span>Answer</button>' +
	                    '</blockquote>';
	            if (t[p].image_url != "")
	            	boxes += '<img src="' + touiteur_img_dir + t[p].image_url + '" class="img-thumbnail">';
	            boxes += '</div>';
			}
			if (new_touites != undefined)
			{
				touites_first_id = first_id;
				$wall_touites.prepend(boxes);
			}
			else
				$wall_touites.append(boxes);
			if (touites_last_id == -1 || new_touites == undefined)
				touites_last_id = last_id;
			if (boxes == "" && new_touites == undefined && nb_touites != 0){
				$load_more_touites.trigger('click');
				return;
			}
			var msnry = $wall_touites.data('masonry');
			if (msnry != undefined)
				msnry.destroy();
			$wall_touites.masonry({
				  columnWidth: 300,
				  itemSelector: '.wall-box',
				  gutter: 30,
				  isFitWidth: true,
				  isInitLayout: true
				});
			$('img').load(function(){
				$wall_touites.data('masonry').layout();
				if (callback != undefined)
					callback();
			});
		}).fail(function(data){
			notify('error', 'Error while Fetching Public Touites !');
		});
	}

	var load_touites_user = function(new_touites, callback){
		var id = $("#user-id").html();
		$.ajax({
			type: api['user_touites']['req_type'],
			url: api['user_touites']['url'],
			dataType: api['user_touites']['res_type'],
			data: {
				token: $.cookie('touiteur_token'),
				item_by_page: touites_page_nb_items_user,
				page: (new_touites != undefined) ? 1 : touites_page_user,
				user_id: id
			}
		}).done(function(data){
			var res = Touiteur_Utilities.Json.decode(data);
			console.log(res);
			var t = res.data.tweets;
			var boxes = "";
			var first_id = Infinity;
			var last_id = -1;
			var nb_touites = res.length;
			for (p in t)
			{
				if (first_id == Infinity)
					first_id = parseInt(t[p].id);
				last_id = parseInt(t[p].id);
				if (new_touites != undefined)
				{
					if (last_id <= touites_first_id_user)
						break;
				}
				else if (last_id >= touites_last_id_user)
					continue;
				var date = new Date(parseInt(t[p].date) * 1000);
				var date_str = $.format.prettyDate(date);
				boxes +=
					'<div class="wall-box">'+
	                	'<blockquote>' +
	                      '<p>' + t[p].content + '</p>' +
	                      '<div class="pull-left"><small>By <a href="#" data-touiteur-goto="profile" data-touiteur-profile="' + t[p].author_id + '" class="text-danger">' + 
	                      t[p].author_login + '</a> '+
	                      '<span class="text-info">' + date_str + '</span></small></div>' +
	                      '<button class="pull-right btn btn-xs btn-warning data-touiteur-action="answer"><span class="glyphicon glyphicon-share-alt"></span>Answer</button>' +
	                    '</blockquote>';
	            if (t[p].image_url != "")
	            	boxes += '<img src="' + touiteur_img_dir + t[p].image_url + '" class="img-thumbnail">';
	            boxes += '</div>';
			}
			if (new_touites != undefined)
			{
				touites_first_id_user = first_id;
				$wall_usertouites.prepend(boxes);
			}
			else
				$wall_usertouites.append(boxes);
			if (touites_last_id_user == -1 || new_touites == undefined)
				touites_last_id_user = last_id;
			/*if (boxes == "" && new_touites == undefined && nb_touites != 0){
				$load_more_usertouites.trigger('click');
				return;
			}*/
			var msnry = $wall_usertouites.data('masonry');
			if (msnry != undefined)
				msnry.destroy();
			$wall_usertouites.masonry({
				  columnWidth: 300,
				  itemSelector: '.wall-box',
				  gutter: 30,
				  isFitWidth: true,
				  isInitLayout: true
				});
			$('img').load(function(){
				$wall_usertouites.data('masonry').layout();
				if (callback != undefined)
					callback();
			});
		}).fail(function(data){
			notify('error', 'Error while Fetching User Touites !');
		});
	}

	var getUserPosition = function() {
		// Initialisation de la carte avec les options
		
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(geolocationSuccess,geolocationError);
		} else {
			notify("error", "Geolocation Is Not Supported by Your Navigator");
		}
	}

	// Fonction de callback en cas de succès
	var geolocationSuccess = function(position) {
	
		var infopos = "Your Position : <br>";
		infopos += "Latitude : "+position.coords.latitude +" | ";
		infopos += "Longitude: "+position.coords.longitude+" | ";
		infopos += "Altitude : "+position.coords.altitude +" | ";
		notify("success", infopos);

		var map_url = "http://maps.googleapis.com/maps/api/staticmap?"
					+ "center="+position.coords.latitude+","+position.coords.longitude+"&zoom=14&size=400x400&sensor=false"
					+ "&markers=color:purple%7C"+position.coords.latitude+","+position.coords.longitude;
		$map.show().find('#map').html('<img src="'+map_url+'" class="img-thumbnail" />');
	}

	// Fonction de callback en cas d’erreur
	var geolocationError = function(error) {
		$map.hide();
		var info = "Geolocation Error : ";
		switch(error.code) {
		case error.TIMEOUT:
			info += "Timeout !";
		break;
		case error.PERMISSION_DENIED:
			info += "We need your permission in order to publish your geolocation.";
		break;
		case error.POSITION_UNAVAILABLE:
			info += "Position could not be determined.";
		break;
		case error.UNKNOWN_ERROR:
			info += "Unknown Error...";
		break;
		}
		notify("error", info);
	}


	var notify = function(type, msg, layout){
		if (layout == undefined)
			layout = "bottom";
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