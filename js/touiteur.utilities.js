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
				var nextChar = input.substring(1).indexOf(':');
				if (nextChar++ == -1)
					return -3;
				var tag = $.trim(input.substring(1, nextChar++));
				if (tag[0] == '"')
					tag = tag.substring(1);
				if (tag[tag.length - 1] == '"')
					tag = tag.substring(0, tag.length - 1);
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
					var nextDelim = input.indexOf(',');
					if (nextDelim == -1)
						nextDelim = input.indexOf('}');
					if (nextDelim == -1)
						return -6;
					nextChar = input.indexOf('"');
					if (nextDelim < nextChar)
						nextChar = nextDelim + 1;
					else
					{
						if (nextChar++ == -1)
							return -4;
						input = input.substring(nextChar);
						nextChar = input.indexOf('"');
						if (nextChar++ == -1)
							return -5;
					}
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
				if (input[0] == '<' && input[1] != '/' && input.indexOf("<![CDATA[") != 0)
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
					var nextCData = input.indexOf("<![CDATA[");
					if (nextChar++ == -1)
						return -4;
					if (nextCData != -1 && nextCData <= nextChar)
					{
						beginContent = 9;
						cdataLength = 2;
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
			str = $.trim(str);
			if (str.indexOf("<?xml") == 0)
				str = $.trim(str.substring(str.indexOf("?>") + 2));
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