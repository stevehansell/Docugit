/*
Dependencies: jquery, mustache, loader

	Usage:
	
	Use leg.factory.loader to get JSON data
						OR
	Create an array of static objects
	var staticLinks = [
		{'name': 'Log in', 'urlName': '', 'className': 'menuLogin'},
		{'name': 'Hints & tips', 'urlName': '', 'className': 'tipsLink'},
		{'name': 'Send us feedback', 'urlName': 'mailto:online@stcloudtimes.com', 'className': 'feedback'}];
		
	
	Constructor arguments:
		1) Link data => Either an object with a navigation property (obj.navigation) or an array of objects
		2) Options hash
			Template configuration => String indicating template file name or an object with 
			'name' and 'location' properties. The template location defaults to /html/mustache
			Events => An object indicating events built inside this object with a true/false value 
			 to bind that event
	
	ex.
	var nav = new window.leg.factory.navigation(staticLinks, {
		'events': {
			'scrollable': true,
		},
		'template': 'navigation_template.html'
	});
	
	Add more nav objects before rendering
	nav.add([{'name': 'Obituaries', 'urlName': 'obituaries'}]);
	
	Render the navigation
	.renderOn argument
		1) Element => 'body' || '.element' || '#element' || $('#element')
		
	nav.renderOn('some-dom-element')
*/

(function($) {

	if (typeof window.leg != 'object') window.leg = {};
	if (typeof window.leg.factory != 'object') window.leg.factory = {};
	
	window.leg.factory.navigation = function(data, options) {
		var me = this, defaults, template;
		me.log = [];
		me.links = [];

		defaults = {
			'events': {
				'handleLinks': true
			},
			'selectors': {
				'selectedArrow': 'g-arrow-selected',
				'selectedClass': 'selected',
				'viewSubNav': '.g-arrow'
			},
			'template': {'location': '/html/mustache/'}
		};
		
		// The request for navigation returns a JSON object with a navigation property that contains the links.
		// If it doesn't have the property, than it must be hard coded, so put it into a navigation property.
		data.navigation || (data = {'navigation': data});
		
		// Template setting in the options can be a string (template name) or an object. Normalize it.
		if (typeof options.template === 'string') {
			template = {'name': options.template};
			options.template = $.extend(defaults.template, template);
		} else {
			options.template = $.extend(defaults.template, options.template);
		}
		
		me.options = $.extend(true, {}, defaults, data, options);
		me.init();
	};
	
	window.leg.factory.navigation.prototype = {
		'init': function() {
			var me = this;
			
			// Ensure it is an array and has a link
			if (typeof me.options.navigation === 'object' && me.options.navigation.length > 0) {
				me.links = me._buildNavLinks(me.options.navigation);
			} else {
				me.log.push({'message': 'Missing navigation links', 'data': me.options.navigation});
				return false;
			}
		},
		'add': function(navigation) {
			var me = this;
			if (typeof navigation !== 'object') {
				me.log.push({'message': 'Invalid navigation object', 'data': navigation});
				return false;
			}
			if (navigation.hasOwnProperty('length') && navigation.length > 0) {
				// navigation is an array, so build each link and push it into the links array
				$.each(navigation, function(i, link) {
					me.links.push(new window.leg.factory.navLink(link));
				});
			} else {
				// navigation is a single link
				me.links.push(new window.leg.factory.navLink(navigation));
			}
			return me;
		},
		'renderOn': function(element) {
			var me = this, view, html, scrollable;
			me.parentElement = element;
			if (typeof element === 'string') element = $(element);
			view = {
				links: me.links
			};
			// Fetch the template from the server. Once it has been fetched, render it on the page.
			me.renderTemplate(function(template) {
				html = Mustache.render(template, view);
				element.append(html);
				me._bindEvents();
			});
		},
		'renderTemplate': function(callback) {
			var me = this;
			$.ajax({
				dataType: 'html',
				error: function(jqXHR, textStatus, errorThrown) {
					me.log.push({'message': 'Template ('+ me.options.template.location + 
										me.options.template.name + '): ' + errorThrown});
				},
			  	success: function(response) {
					callback($(response).html());
				},
				type: 'get',
				url: me.template(),
			});
		},
		'template': function() {
			// Build the request path to the template
			return this.options.template.location + this.options.template.name;
		},
		'_bindEvents': function() {
			var me = this, events = me.options.events;
			$.each(events, function(e, v) {
				// If the event is set in the options, bind the actual event from the event object
			 if (v) me.events[e].apply(me); // Bind each event and explicitly set 'this' to me
			});
		},
		'_buildNavLinks': function(navigation, isSubNavigation) {
			var me = this, links = [], children = [], navItem;
			$.each(navigation, function(i, item) {
				if (item.children) {
					// If this has subnavigation, recursively build those links and nest them inside the object.
					children.push(me._buildNavLinks(item.children, true));
				} else {
					children = [];
				}
				navItem = new window.leg.factory.navLink(item, isSubNavigation);
				if (children.length > 0) {
					navItem.children = children[0];
					navItem.hasChildren = true;
				}
				links.push(navItem);
			});
			return links;
		},
		'events': {
			'displaySubNav': function() {
				var me = this, viewSubNavElement, navLinks;
				viewSubNavElement = $(me.parentElement).find(me.options.selectors.viewSubNav);
				viewSubNavElement.bind('click', function(e) {
					var elem = $(this), selectedArrowClass = me.options.selectors.selectedArrow;
					if (elem.hasClass(selectedArrowClass)) {
						elem.removeClass(selectedArrowClass).next('ul').slideUp(function() {
							if (me.scroller) me.scroller.refresh();
						});
					} else {
						elem.addClass(selectedArrowClass).next('ul').slideDown(function() {
							if (me.scroller) me.scroller.refresh();
						});
					}
					e.preventDefault();
				});
			},
			'handleLinks': function() {
				var me = this,
				navLinks = $(me.parentElement).find('a'),
				link, selectedClass;
				navLinks.bind('click', function(e) {
					link = $(this), selectedClass = me.options.selectors.selectedClass;
					$(document).trigger('navigation.navigate', [link, link.attr('href')]);
					$(me.parentElement).find('li').removeClass(selectedClass);
					link.parents('li').addClass(selectedClass);
					e.preventDefault();
				});
			},
			'hideable': function() {
				var me = this, navContainer;
				navContainer = $(me.parentElement).parents('nav');
				$(document).bind('navigation.display', function(e, elem) {
					$(elem).removeClass('hide').addClass('display');
				});
				$(document).bind('navigation.hide', function(e, elem) {
					$(elem).removeClass('display').addClass('hide');
				});
			},
			'scrollable': function() {
				var me = this, scrollerElement;
				document.addEventListener('touchmove', function(e) {e.preventDefault();});
				scrollerElement = $(me.parentElement).parent();
				if (!scrollerElement.data('scrollable')) { // Prevent the scroller from being bound twice
					scrollerElement.data('scrollable', true);
					me.scroller = new iScroll(scrollerElement.attr('id'), {'desktopCompatibility': true});
				}
			},
			'stickToBottom': function() {
				var me = this, adjustPosition, timeout, navContainer, windowHeight, navHeight;
				navContainer = $(me.parentElement).parents('nav');
				$(window).resize(function() {
					(timeout) ? clearTimeout(timeout) : adjustPosition();
					timeout = setTimeout(adjustPosition, 100);
				});
				adjustPosition = function() {
					windowHeight = $(this).height();
					navHeight = navContainer.offset().top + navContainer.outerHeight();
					if (windowHeight < navHeight) {
						navContainer.addClass('scroll-view');
					} else {
						navContainer.removeClass('scroll-view');
					}
					if (me.scroller) {
						me.scroller.refresh();
					}
				};
				adjustPosition();
			}
		}
	};

	window.leg.factory.navLink = function(link, subLink) {
		this.init(link, subLink);
	};
	window.leg.factory.navLink.prototype = {
		'init': function(link, subLink) {
			this.external = link.externalURL !== undefined;
			this.name = link.name;
			this.subLink = subLink || false;
			this.url = link.externalURL || link.urlName;
			this.className = link.className || '';
		}
	};
})(jQuery);