
var Touiteur_Utilities = (function(){

	var Json = (function(){
			var decode_rec = function(input, obj){
			while (input.length != 0)
			{
				console.log("Beginning of Parsing : " + input + " ! ");
				input = $.trim(input);
				if (input[0] == '}')
				{
					console.log("Returning From Recursive Call in " + tag + " ! " + input.substring(1));
					return input.substring(1);
				}
				var nextChar = input.substring(1).indexOf(":");
				if (nextChar++ == -1)
					return -3;
				var tag = $.trim(input.substring(1, nextChar++));
				input = $.trim(input.substring(nextChar));
				if (input[0] == '{')
				{
					obj[tag] = {};
					console.log("!!! Recursive call in object " + tag + " !!!" + input);
					input = decode_rec(input, obj[tag]);
					if (!isNaN(parseInt(input)))
					{
						console.log("!!! Recursive Call FAILED : Error " + parseInt(input));
						return input;
					}
					console.log("!!! Recursive call DONE in object " + tag + " !!! " + input + " ## ");
				}
				else
				{
					nextChar = input.indexOf('"');
					if (nextChar++ == -1)
						return -4;
					input = input.substring(nextChar);
					nextChar = input.indexOf('"');
					if (nextChar++ == -1)
						return -5;
					content = input.substring(0, nextChar - 1);
					input = input.substring(nextChar);
					obj[tag] = content;
					console.log(">>> Insertion of tag #" + tag + "# with content #" + content + "# in object <<<");
					console.log(obj);
				}
			}
			return input;
		};

		var decode = function(str){
			var debug_func = console.log;
			if (touiteur_debug == false)
			{
				console.log = function(){};
			}
			var res = {};
			var status = decode_rec(str, res);
			if (!isNaN(parseInt(status)))
				console.error("Touiteur: JSON: Error Code " + status);
			console.log = debug_func;
			return res;
		};

		return {
			decode: decode
		}
	})();

	var Xml = (function(){
			var decode_rec = function(input, obj){
			while (input.length != 0)
			{
				console.log("Beginning of Parsing : " + input + " ! ");
				if (input[0] != '<')
				{
					console.log("Parsing Failed, not an opening tag : " + input);
					return -2;
				}
				var nextChar = input.substring(1).indexOf(">");
				if (nextChar++ == -1)
					return -3;
				var tag = input.substring(1, nextChar++);
				if (tag[0] == '/')
				{
					console.log("Returning From Recursive Call in " + tag + " ! " + input);
					return input.substring(nextChar);
				}
				input = input.substring(nextChar);
				if (input[0] == '<' && input[1] != '/')
				{
					obj[tag] = {};
					console.log("!!! Recursive call in object " + tag + " !!!" + input);
					input = decode_rec(input, obj[tag]);
					if (!isNaN(parseInt(input)))
					{
						console.log("!!! Recursive Call FAILED : Error " + parseInt(input));
						return input;
					}
					console.log("!!! Recursive call DONE in object " + tag + " !!! " + input + " ## ");
				}
				else
				{
					nextChar = input.indexOf("<");
					var nextCData = input.indexOf("//<![CDATA[");
					if (nextChar++ == -1)
						return -4;
					if (nextCData != -1 && nextCData < nextChar)
					{
						beginContent = 11;
						cdataLength = 4;
						nextChar = input.substring(beginContent).indexOf("<");
						content = input.substring(beginContent, beginContent + nextChar - 1 - cdataLength);
						input = input.substring(beginContent + 1 + nextChar + tag.length + 2);
					}
					else
					{
						content = input.substring(0, nextChar - 1);
						input = input.substring(nextChar + tag.length + 2);
					}
					obj[tag] = content;
					console.log(">>> Insertion of tag #" + tag + "# with content #" + content + "# in object <<<");
					console.log(obj);
				}
			}
			return input;
		};

		var decode = function(str){
			var debug_func = console.log;
			if (touiteur_debug == false)
			{
				console.log = function(){};
			}
			var res = {};
			var status = decode_rec(str, res);
			if (!isNaN(parseInt(status)))
				console.error("Touiteur: XML: Error Code " + status);
			console.log = debug_func;
			return res;
		};

		return {
			decode: decode
		}
	})();

	return {
		Json: Json,
		Xml: Xml
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
		home: { container: "#screen-2", navbar: true },
		post: { container: "#screen-3", navbar: true }
	};
	var screen_current;
	var screen_old = screens.signin;

	$post_content = $('#post_content');
	$post_touite = $('#post_touite');
	$wall = $('.wall');
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

		// initialize
		$wall.masonry({
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
				data: {
					login: $(this).find('input[name=login]').val(),
					mail: $(this).find('input[name=mail]').val(),
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
				url: api['signin']['url'],
				data: {
					login: $(this).find('input[name=login]').val(),
					password: $(this).find('input[name=password]').val()
				}
			}).done(function(data){
				notify('success', 'Successful Authentication !');
				renderTab('home');
			}).fail(function(data){
				notify('error', 'Authentication Failed !');
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
		switch (screen)
		{
			case "home":
				$wall.data('masonry').layout();
			break;
			case "post":
				$post_touite.focus();
				var write = function(){
					var str = $(this).val();
					if (str == "")
						$post_content.html("Write a Touite, You won't regret it !");
					else
						$post_content.html(str.replace(" ", "&nbsp;"));
				};
				$post_touite.on('keydown', write);
				$post_touite.on('keypress', write);
				$post_touite.on('keyup', write);
			break;
		}
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
	touiteur_debug = true;
	initScreen = 'signin';
	Touiteur.init(initScreen);
	//console.log(Touiteur_Utilities.Json.decode('{yo:{yo2:{yo3:"mama"},imad:"yeah"}}'));
	//console.log(Touiteur_Utilities.Xml.decode('<yo>qsd</yo><yo2>mama</yo2><yo6><yo4><yo3><imad>mama</imad></yo3></yo4></yo6><yo5>//<![CDATA[yeah//]]></yo5><yo10><yo9>qsd</yo9></yo10>'));
	//console.log(Touiteur_Utilities.Xml.decode('<?xml version="1.0" encoding="utf-8"?><root><api_version>1.0</api_version><success>true</success><message></message><data><user><id>37</id><token>qsdqsd</token></user></data></root>'));
});