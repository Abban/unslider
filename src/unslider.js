/**
 *   Unslider by @idiot and @damirfoy
 */

(function($, f, doc, _transitionend, _TransitionEnd) {
	var Unslider = function() {
		//  Cached strings
		var _special = $.event.special,
			_move = 'move',
			_movestart = _move + 'start',
			_moveend = _move + 'end',
			_swipe = 'swipe',
			_swipeleft = _swipe + 'left',
			_drag = 'drag',
			_mouseout = 'mouseout',
			_dot = 'dot';

		//  Clone attack
		var _ = this;

		//  Set some options
		_.o = {
			speed: 500,   // animation speed, false for no transition (integer)
			delay: 3000,  // delay between slides, false for no autoplay (integer or boolean)
			// init: 0,   // init delay, false for no delay (integer or boolean)
			pause: !f,    // pause on hover (boolean)
			loop: !f,     // infinitely looping (boolean)
			// from: 1,   // number of slide to start from
			// use: f,    // helper list selector, can be used for thumbs (string or boolean)
			// keys: f,   // keyboard shortcuts (boolean)
			// dots: f,   // display ••••o• pagination (boolean)
			// arrows: f, // display prev/next arrows (boolean)
			prev: '←',    // text or html inside prev button (string)
			next: '→',    // same as for prev option
			// fluid: f,  // is it a percentage width? (boolean)
			// before: f, // invoke before animation starts (function with argument)
			// after: f,  // invoke when animation is finished (function with argument)
			touch: _drag  // or 'swipe', false to disable (string or boolean)
		};

		//  Detect CSS3 support
		var css3,
			props = {OTransition: 'o' + _TransitionEnd + ' o' + _transitionend, msTransition: _transitionend, MozTransition: _transitionend, WebkitTransition: 'webkit' + _TransitionEnd, transition: _transitionend};

		for (prop in props)
			if (typeof doc.documentElement.style[prop] == 'string') css3 = {n: prop, c: props[prop]};

		_.init = function(el, o) {
			_.el = el;
			_.ul = el.find('>ul');
			_.max = [el.outerWidth() | 0, el.outerHeight() | 0];
			_.li = _.ul.find('>li').each(function(index) {
				var me = $(this),
					width = me.outerWidth(),
					height = me.outerHeight();

				//  Set the max values
				if (width > _.max[0]) _.max[0] = width;
				if (height > _.max[1]) _.max[1] = height;
			});

			//  Check whether we're passing any options in to Unslider
			_.o = $.extend(_.o, o);

			//  Cached vars
			var o = _.o,
				touch = o.touch,
				ul = _.ul,
				li = _.li,
				len = li.length,
				from = o.from | 0,
				use;

			//  Convert from option to index
			if (from > len || from == 0) from = 0; else --from;

			//  Current indeed
			_.i = from;

			//  Set the main element
			el.css({width: _.max[0], height: li.first().outerHeight(), overflow: 'hidden'});

			//  Set the relative widths
			ul.css({position: 'relative', left: -(from * 100) + '%', width: (len * 100) + '%'});
			li.css({'float': 'left', width: (100 / len) + '%'});

			//  Thumbs?
			if (o.use) {
				use = $(o.use).find('>li');

				if (use.length) {
					_.use = use;

					use.click(function() {
						_.stop().to($(this).index());
					}).eq(_.i).addClass('active');
				};
			};

			//  Autoslide
			setTimeout(function() {
				if (o.delay | 0) {
					_.play();

					if (o.pause) {
						el.on('mouseover ' + _mouseout, function(e) {
							_.stop();
							e.type == _mouseout && _.play();
						});
					};
				};
			}, o.init | 0);

			//  Keypresses
			if (o.keys) {
				$(doc).keydown(function(e) {
					var key = e.which;

					if (key == 37)
						_.prev(); // Left
					else if (key == 39)
						_.next(); // Right
					else if (key == 27)
						_.stop(); // Esc
				});
			};

			//  Dot pagination
			o.dots && nav(_dot);

			//  Arrows support
			o.arrows && nav('arrow');

			//  Patch for fluid-width sliders. Screw those guys.
			if (o.fluid) {
				$(window).resize(function() {
					_.r && clearTimeout(_.r);

					_.r = setTimeout(function() {
						var styl = {height: li.eq(_.i).outerHeight()},
							width = el.outerWidth();

						_.max[0] = width;
						ul.css(styl);
						styl['width'] = Math.min(Math.round((width / el.parent().width()) * 100), 100) + '%';
						el.css(styl);
					}, 50);
				}).resize();
			};

			//  Touch support
			if (touch) {
				el.on(_movestart + ' move ' + _moveend + ' ' + _swipeleft + ' swiperight swipeLeft swipeRight', function(e) {
					var type = e.type.toLowerCase(),
						x = e.distX,
						y = e.distY,
						index = _.i,
						left = -index * 100,
						path = 100 * x / _.max[0],
						styl = ul[0].style;

					if (touch == _drag && _special[_move]) {
						//  Drag support
						if (type == _movestart) {
							if (x > y && x < -y || x < y && x > -y) {
								e.preventDefault();
								return;
							} else {
								if (css3) styl[css3.n] = 'left 0ms ease';
								_.drag = !f;
							};
						} else if (type == _move) {
							styl['left'] = left + path + '%';
						} else if (type == _moveend) {
							path = path | 0;

							if (path < -10)
								_.to(++index);
							else if (path > 10)
								_.to(--index);
							else
								_.to(index);

							_.stop();
							_.drag = f;
						};
					} else if (touch == _swipe && (_special[_swipe] || $.Event(_swipe))) {
						//  Swipe support
						type == _swipeleft ? _.prev() : _.next();
					};
				});
			};

			return _;
		};

		//  Move Unslider to a slide index
		_.to = function(index) {
			var o = _.o,
				el = _.el,
				ul = _.ul,
				li = _.li,
				current = _.i,
				drag = _.drag,
				target = li.eq(index);

			//  To slide or not to slide
			if (index == current && !drag || (!target.length || index < 0) && o.loop == f) return;

			//  Check if it's out of bounds
			if (!target.length) index = drag ? current : 0;
			if (index < 0) index = drag ? current : li.length - 1;
			if (index == current) target = li.eq(current);
			_.i = index;

			$.isFunction(o.before) && o.before(el);
			toggle(el.find('.dot:eq(' + index + ')'));
			if (_.use) toggle(_.use.eq(index));

			var speed = o.speed | 0,
				tail = css3 ? speed + 'ms ease-in-out' : {duration: speed, queue: f},
				animH = target.outerHeight() + 'px',
				animL = '-' + index + '00%',
				anim = css3 ? 'height ' + tail : {height: animH},
				styl = {el: el[0].style, ul: ul[0].style};

			if (css3) {
				//  CSS3 transition
				styl.el[css3.n] = anim;
				styl.el['height'] = animH;
				styl.ul[css3.n] = anim + ', left ' + tail;
				styl.ul['height'] = animH;
				styl.ul['left'] = animL;

				ul.on(css3.c, function() {
					ul.off(css3.c);
					after();
				});
			} else {
				//  jQuery animation
				el.animate(anim, tail);

				anim['left'] = animL;
				tail['complete'] = after;
				ul.animate(anim, tail);
			};
		};

		//  Autoplay functionality
		_.play = function() {
			if (!_.drag) {
				_.t = setInterval(function() {
					_.to(_.i + 1);
				}, _.o.delay | 0);
			};
		};

		//  Stop autoplay
		_.stop = function() {
			_.t = clearInterval(_.t);
			return _;
		};

		//  Move to previous/next slide
		_.next = function() {
			return _.stop().to(_.i + 1);
		};

		_.prev = function() {
			return _.stop().to(_.i - 1);
		};

		//  Create dots and arrows
		function nav(name, html) {
			if (name == _dot) {
				html = '<ol class="dots">';
					$.each(_.li, function(index) {
						html += '<li class="' + (index == _.i ? name + ' active' : name) + '">' + ++index + '</li>';
					});
				html += '</ol>';
			} else {
				html = '<div class="';
				html = html + name + 's">' + html + name + ' prev">' + _.o.prev + '</div>' + html + name + ' next">' + _.o.next + '</div></div>';
			};

			_.el.addClass('has-' + name + 's').append(html).find('.' + name).click(function() {
				var me = $(this);
				me.hasClass(_dot) ? _.stop().to(me.index()) : me.hasClass('prev') ? _.prev() : _.next();
			});
		};

		//  Toggle active class on dots and thumbs
		function toggle(element) {
			element.addClass('active').siblings().removeClass('active');
		};

		//  Callback fired after animation is finished
		function after() {
			$.isFunction(_.o.after) && _.o.after(_.el);
		};
	};

	//  Create a jQuery plugin
	$.fn.unslider = function(o) {
		var len = this.length;

		//  Enable multiple-slider support
		return this.each(function(index) {
			//  Cache a copy of $(this), so it
			var me = $(this),
				key = 'unslider' + (len > 1 ? '-' + ++index : ''),
				instance = (new Unslider).init(me, o);

			//  Invoke an Unslider instance
			me.data(key, instance).data('key', key);
		});
	};
})(jQuery, false, document, 'transitionend', 'TransitionEnd');
