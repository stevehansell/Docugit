/*+

#Loader.js
This is a Javascript loader.

##Dependencies
1. jQuery

##Usage
```javascript
window.leg.loader = new window.leg.factory.loader({
	'cacheBuster': 'cachebuster3000=1',
	'registeredResources': {
		'js1': '1.js',
		'js2': {
			'url': '2.js',
			'dependencies':['css1','js3']
		},
		'js3': {
			'url': '3.js',
		},
		'css1': {
			'url': '1.css',
			'dependencies':['js1']
		},
	},
	'initLoadList': [
		'js2'
	]
});
```
+*/
(function($){ 
	if(typeof window.leg != 'object') window.leg = {}; // If this is the first leg componenet, create a base.
	if(typeof window.leg.factory != 'object') window.leg.factory = {}; // If this is the first leg componenet, create a base.
	window.leg.factory.loader = function(options){
		var o = this;
		var defaults = {
			'cacheBuster': null, 
			'initDefer': false, // Keep object from being automatically initialized on instantiation
			'registeredResources': {},
			'initLoadList': []
		};
		o.options = $.extend({}, defaults, options);
		o.log = []; // Because we believe every object deserves a voice.
		o.factory = {};
		o.is = {
			'loading': false
		};
		o.data = {
			'loadedList': [],
			'failedToLoadList': [],
			'loadedItems': [],
			'failedToLoadItems' : []
		};
		if(!o.options.initDefer) o.init();
		return o;
	};
	window.leg.factory.loader.prototype = {
		'init': function(){
			var o = this;
			
			o.initWatcher();
			
			// Setup any neccessary sub factories
			// loadItem: Is an object created for every file you try to load
			o.factory.loadItem = function(options){
				var item = this;
				item.is = {};
				item.data = {};
				
				// If options is just a string it is either an alias or a url
				if(typeof options == 'string'){
					var alias = options;
					if(typeof o.options.registeredResources[options] == 'object'){
						options = o.options.registeredResources[options];
					}else if(typeof o.options.registeredResources[options] == 'string'){
						options = {'url': o.options.registeredResources[options]};
					}else{
						options = {'url': options};
					}
					item.alias = alias; // Setup the alias
				}else{
					o.log.push({
						'message': 'Load item options should always be a string',
						'data': options
					});
					item.is.valid = false;
					return false;
				}
				
				var defaults = { // Set defaults
					'cacheBuster': null,
					'url': null,
					'type': null,
					'runBefore': function(){},
					'runAfterSuccess': function(){},
					'runAfterFail': function(){},
					'runAfter': function(){}
				};
				
				item.options = $.extend({}, defaults, options);
				if(typeof item.options.url != 'string'){ // If the options aren't passed tell the world about it and fail.
					o.log.push({
						'message': 'Load item options missing url',
						'data': item.options
					});
					item.is.valid = false;
					return false;
				}
				
				if(o.options.cacheBuster!=null || item.options.cacheBuster!=null){ // Append cacheBuster to URL
					item.options.cacheBuster = (item.options.cacheBuster!=null)?item.options.cacheBuster:o.options.cacheBuster;
					item.options.url = item.options.url + (((/\?/).test(item.options.url))?'&':'?') + item.options.cacheBuster;
				}

				if(item.options.type == null){ // Setting up type based on extension
					var urlSplit = item.options.url.split('?')[0];
					var type = (/css$|js$|txt$|html$/).exec(urlSplit);

					if(type && typeof type.length == 'number' && type.length > 0){
						item.options.type = type[0];
					}else{ 
						o.log.push({
							'message': 'Load item missing type'
						});
					}
				}
				item.is.valid = true;
				
				
				// Log the options used to init.
				o.log.push({
					'message': 'Init Finished',
					'data': o.options
				});
				return item;
			}
			
			o.load(o.options.initLoadList);
			return o;
		},
		'load': function(loadList,handleDependencies,forceLoad){
			var o = this;
			if(typeof forceLoad == 'undefined') forceLoad = false;
			if(typeof handleDependencies == 'undefined') handleDependencies = true;
			if(typeof loadList == 'string') loadList = [loadList];
			if(handleDependencies) loadList = o._buildDependencies(loadList);

			// Defer loading till current set of loads is done.
			if(o.is.loading && !forceLoad){ 
				$(document).one('loader.batchLoadComplete',function(){o.load(loadList,false);});
				return false;
			}else if(!o.is.loading){
				o.is.loading = true;
				$(document).trigger('loader.batchLoadStarted',[ $.merge([],loadList) ]);
			}

			if(loadList.length>0){
				var item = new o.factory.loadItem(loadList[0]);
				var loadOptions;

				// Setup the generic options
				var loadDefaults = {
					'url': item.options.url,
					'dataType': 'script',
					'beforeSend': function(){ item.options.runBefore(); },
					'doIt': function(options){ $.ajax(loadOptions); },
					'success': function(response){
						item.is.loaded = true;
						item.data[item.options.type] = response;
						o.log.push({
							'message': 'Load item loaded successfully',
							'data': item
						});
						loadList.splice(0,1);
						o.data.loadedList.push(item.alias);
						o.data.loadedItems.push(item);
						$(document).trigger('loader.itemLoadedSuccessfully',[item.alias,item]);
						item.options.runAfterSuccess();
						if(loadList.length>0){
							o.load(loadList,false,true); // Since we batch handled dependencies we can skip that this next round.
						}else{
							o.is.loading = false;
							$(document).trigger('loader.batchLoadComplete');
						}
					},
					'error': function(){
						item.is.loaded = false;
						o.log.push({
							'message': 'Load item failed',
							'data': item
						});
						o.data.failedToLoadItems.push(item.alias);
						o.data.failedToLoadList.push(item);
						item.options.runAfterFail();
					},
					'complete': function(){ item.options.runAfter(); } 
				};
				
				// Setup type specific ajax options
				switch(item.options.type){
					case 'js':
						loadOptions = {
							'method': 'ajax',
							'dataType': 'script',
							'cache': true
						};
						break;
					case 'txt':
						loadOptions = {
							'method': 'ajax',
							'dataType': 'txt',
							'cache': true
						};
						break;
					case 'html':
						loadOptions = {
							'method': 'ajax',
							'dataType': 'html',
							'cache': true
						};
						break;
					case 'css':
						loadOptions = {
							'method': 'element',
							'doIt': function(){
								var element = $('head').append('<'+loadOptions.element+'>').children(':last');
								element.load(function(){alert('CSS loaded');});
								element.attr(loadOptions.attributes);
							},
							'element': 'link',
							'attributes': {
						    	rel: 'stylesheet',
						    	type: 'text/css',
						    	href: item.options.url
						    }
						};
						break;
				}
				
				// Merge defaults and specifics
				loadOptions = $.extend({}, loadDefaults, loadOptions);

				// Run the ajax request
				switch(loadOptions.method){
					case 'ajax':
						loadOptions.doIt(loadOptions);
						break;
					case 'element':
						loadOptions.beforeSend();
						loadOptions.doIt(loadOptions);
						loadOptions.success();
						loadOptions.complete();
						break;
				}
			}else{
				o.is.loading = false;
				$(document).one('loader.batchLoadComplete',function(){o.load(loadList,false);});
			}
		},
		'registerResource': function(newResources,load){
			var o = this;
			o.options.registeredResources = $.extend(newResources,o.options.registeredResources); // New resources may not alter exisiting resources.
			if(typeof load == 'object' && typeof load.length == 'number' && load.length>0) o.load(load); // Allows you to now load newly registered items quickly.
		},
		'initWatcher': function(){
			var o = this;
			o.watchList = {};
			
			jQuery(document).bind('loader.itemLoadedSuccessfully',function(e,alias,item){
				if(typeof o.watchList[alias] == 'object' && o.watchList[alias].length > 0){
					for(var i=0; i<o.watchList[alias].length; i++){
						if(typeof o.watchList[alias][i] == 'function') o.watchList[alias][i](e,alias,item);
					}
				}
			});
		},
		'watch': function(alias,callback){
			var o = this;
			if(typeof o.watchList[alias] != 'object') o.watchList[alias] = [];
			o.watchList[alias].push(callback);			
		},
		'_buildDependencies': function(loadList){
			var o = this;
			
			for(var i=0; i<loadList.length; i++){
				if( // If there is a dependency
					typeof o.options.registeredResources[loadList[i]] == 'object' 
					&& typeof o.options.registeredResources[loadList[i]].dependencies == 'object'
					&& typeof o.options.registeredResources[loadList[i]].dependencies.length == 'number'
					&& o.options.registeredResources[loadList[i]].dependencies.length > 0
				){
					var lengthBefore = loadList.length; // Remember the current load list length
					
					// Split the array where the dependencies should be added
					var first = loadList.slice(0,i);
					var second = o.options.registeredResources[loadList[i]].dependencies;
					var third = loadList.slice(i,loadList.length);
					
					loadList = $.extend( [], o._filterUniqueDependencies( $.merge($.merge(first,second),third), o.data.loadedList ) ); // Merge all three array parts
					var lengthAfter = loadList.length; // Get the new load list length
					
					i = i+second.length+1; // Rest the index to account for the extra dependencies added. +1 to increment.
					if(lengthBefore<lengthAfter) loadList = o._buildDependencies(loadList); // Recursively build sub dependencies
				}
			}
			return loadList;
		},
		'_filterUniqueDependencies': function(arrayOriginal,loadedList){
			var arrayNew = [];
			if(typeof usedArray == 'undefined') var usedArray = [];
			usedArray = $.merge(usedArray,loadedList);
			
			for(var i=0; i<arrayOriginal.length; i++){ // Loop through array items
				var item = arrayOriginal[i];
				if($.inArray(item, usedArray) === -1){ // See if this item is already in the new array.
					usedArray.push(item); // If it is not in the array add it to the index string...
					arrayNew.push(item); // ...and array.
				}
			}
			return arrayNew;
		}
	};
})(jQuery);
