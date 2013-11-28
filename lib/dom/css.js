/**
 * module  DOM/css
 */
;(function(K, NULL){


// __SELECTOR makes sure that element is a DOMElement/DOMDocument
function getDocument(element){
	// window
	return 'setInterval' in element ? element.document 
	
		// document
		: 'getElementById' in element ? element 
			: element.ownerDocument;
};


function camelCase(str){
	return str.replace(REGEX_CAMELCASE, function(matchAll, match1){
		return match1.toUpperCase();
	});
};


function hyphenate(str){
	return str.replace(REGEX_HYHPENATE, function(matchAll){
		return '-' + matchAll;
	});
};

// TODO: add hooks for compatibility
function filterCSSType(name){
	return camelCase(name === 'float' ? STR_FLOAT_NAME : name);
};


// from jQuery
function swap(element, styles, callback){
	var old = {}, name;

	// Remember the old values, and insert the new ones
	for(name in styles){
		old[name] = element.style[name];
		element.style[name] = styles[name];
	}

	callback.call(element);

	// Revert the old values
	for(name in styles){
		element.style[name] = old[name];
	}
};


/**
 * Get the value of a style property for the first element
 * @this {DOMElement}
 * @param {string} name Array is not allowed, unlike mootools
 * @return {string|number|(Array.<number>)}
 	- {string} numeric values with *units*, such as font-size ('12px'), height, width, etc
 	- {number} numeric values without units, such as zIndex
 	- ? {Array} color related values, always be [<r>, <g>, <b>, <a>] // TODO
 	
 * never determine your control flow by css styles!
 */
function getCSS(name){
	name = filterCSSType(name);
	
	var el = this, ret,
		specified = CSS_methods[name];
		
	if(specified && specified.GET){
		ret = specified.GET(el);
	
	}else{
		ret = el.style[name];
		
		if(!ret || name === 'zIndex'){
			ret = currentCSS(el, name);
		}
	}
	
	// TODO: color
	
	return ret;
};


/**
 * get width and height of an element
 */
function getWH(element, property){
	var minus = property === 'width' ? ['left', 'right'] : ['top', 'bottom'], 
		ret = element[camelCase('offset-' + property)];
		
	minus.forEach(function(v){
		ret -= ( parseFloat(getCSS.call(this, 'border-' + v + '-width')) || 0 )
			  + ( parseFloat(getCSS.call(this, 'padding-' + v)) || 0 );
	}, element);
	
	return ret;
};


var DOM = K.DOM,
	UA = K.UA,
	DOC = document,
	HTML = DOC.documentElement,
	TRUE = true,
	
	currentCSS,
	
	REGEX_CAMELCASE = /-([a-z])/ig,
	REGEX_HYHPENATE = /[A-Z]/g,
	REGEX_OPACITY = /opacity=([^)]*)/,
	REGEX_FILTER_ALPHA = /alpha\([^)]*\)/i,
	// REGEX_NUM_PX = /^-?\d+(?:px)?$/i,
	// REGEX_NUM = /^-?\d+/,
	
	// 0.123
	// .23
	// 23.456
	// REGEX_CSS_VALUE_NUMBER = /^(?:\d*\.)?\d+(?=px$)/i,
	
	STR_CSSFLOAT = 'cssFloat',
	
	STYLE_INVISIBLE_SHOW = {
		position	: 'absolute',
		visibility	: 'hidden',
		display		: 'block'
	},
	
	feature = DOM.feature,
												 
	STR_FLOAT_NAME = STR_CSSFLOAT in HTML.style ?
		STR_CSSFLOAT 		// standard, IE9+
		: 'styleFloat', 	// IE5.5 - IE8, IE9
		
	CSS_methods = {},
	
	CSS_CAN_BE_SINGLE_PX = {
		// offset
		// left: TRUE, top: TRUE, bottom: TRUE, right: TRUE,
		
		// size
		width: TRUE, height: TRUE, maxwidth: TRUE, maxheight: TRUE, minwidth: TRUE, minheight: TRUE, textindent: TRUE,
		
		// text
		fontsize: TRUE, letterspacing: TRUE, lineheight: TRUE,
		
		// box
		margin: TRUE, padding: TRUE, borderwidth: TRUE
	};


// @private
// get computed styles
currentCSS = feature.curCSS = feature.computedStyle ? 

	// standard
	function(element, property){
		var defaultView = getDocument(element).defaultView,
	
			// ref: https://developer.mozilla.org/en/DOM/window.getComputedStyle
			computed = defaultView ? defaultView.getComputedStyle(element, null) : null;
			
		return (computed) ? 
			computed.getPropertyValue( property === STR_FLOAT_NAME ? 'float' : hyphenate(property) ) 
			: null;
	} :

	// IE5.5 - IE8, ref: 
	// http://msdn.microsoft.com/en-us/library/ms535231%28v=vs.85%29.aspx
	// http://www.quirksmode.org/dom/w3c_html.html
	function(element, property){
		var currentStyle = element.currentStyle;
	
		return currentStyle && currentStyle[camelCase(property)] || '';
	};
	
/*
	
	// convert all other units to pixel
	function(element, property){
		var left,
			ret = element.currentStyle && element.currentStyle[ property ],
			runtime_left = element.runtimeStyle && element.runtimeStyle[ property ],
			style = element.style;

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number ( kael: such as '1em')
		// but a number that has a weird ending, we need to convert it to pixels
		if ( !REGEX_NUM_PX.test( ret ) && REGEX_NUM.test( ret ) ) {
			// Remember the original values
			left = style.left;

			// Put in the new values to get a computed value out(kael: pixel value)
			if ( runtime_left ) {
				elem.runtimeStyle.left = elem.currentStyle.left;
			}
			style.left = property === 'fontSize' ? '1em' : (ret || 0);
			ret = style.pixelLeft + 'px';

			// Revert the changed values
			style.left = left;
			if ( runtime_left ) {
				elem.runtimeStyle.left = runtime_left;
			}
		}

		return ret === "" ? "auto" : ret;
	};
*/


if(!feature.opacity){

	// from jQuery
	CSS_methods.opacity = {
	
		// will never adjust 'visibility' of element, unlike mootools
		SET: function(element, opacity){
			var style = element.style,
				currentStyle = element.currentStyle,
				filter = currentStyle && currentStyle.filter || style.filter || '';

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;
			
			opacity = Number(opacity);
			opacity = opacity || opacity === 0 ?
				  'alpha(opacity=' + opacity * 100 + ')'
				: '';

			style.filter = REGEX_FILTER_ALPHA.test( filter ) ?
				  filter.replace( REGEX_FILTER_ALPHA, opacity )
				: filter + ' ' + opacity;
		},
		
		// @return {number}
		GET: function(element){
			return '' + (
				REGEX_OPACITY.test( currentCSS(element, 'filter') || '' ) ?
				  	parseFloat( RegExp.$1 ) / 100
					: 1
			);
		}
	};
}


/**
 * never use .css('margin'), but .css('margin-*') instead, as well as:
 * border, border-color, border-width, padding, etc.
 
 * it's useless that you get values like '100px 20px 10px 5px' which is hardly operated.
 
 * for a better control structure, do something like below:
 <code>
	if( parseInt($('#container').css('margin-right')) === 100){
		// code...
	}
 </code>
 */
// CSS_methods.margin


// When an element is temporarily not displayed, the height and width might be 0
// so they need special treatment
['height', 'width'].forEach(function(property){
	CSS_methods[property] = {
		GET: function(element){
			var ret;
		
			// if element is set display: none;
			if(element.offsetWidth === 0){
			
				// temporarily and shortly set the element not display:none 
				swap(element, STYLE_INVISIBLE_SHOW, function(){
					ret = getWH(element, property);
				});
				
			}else{
				ret = getWH(element, property);
			}
			
			return ret;
		}
	};
});


['top', 'right', 'bottom', 'left'].forEach(function(direction){
	var list = CSS_CAN_BE_SINGLE_PX;
	
	list[direction] = 
	list['margin' + direction] = 
	list['padding' + direction] = 
	list['border' + direction + 'width'] = true;
});


// add css getter and setter to DOM hook functions
DOM.methods.css = {
	len: 1,
	
	/**
	 * @param {string} name
	 * @param {number|string} value
	 	setter of css will be simple, value will not accept Array. unlike mootools
	 */
	SET: K._overloadSetter(function(name, value){
		name = filterCSSType(name);
	
		var el = this,
			specified = CSS_methods[name];
		
		// if has a specified setter
		if(specified && specified.SET){
			specified.SET(el, value);
			
		}else{
			if( CSS_CAN_BE_SINGLE_PX[name.toLowerCase()] && (
					// is number string and the current style type need 'px' suffix
					// -> .css('margin', '20')   
					// -> .css('margin', 20)

                    // NaN + '' === '' + Number('NaN')
					(value += '') && value === '' + Number(value)
				)
			){
                // fix NaN -> 0
				value = ( Number(value) || 0 ) + 'px';
			}
			
			el.style[name] = value;
		}
	}),
	
	GET: getCSS	
};


})(DP, null);

/**
 change log:
 
 2011-10-27  Kael:
 - fix the getter of css when getting 'height' of an element which it's not in the DOM
 
 2011-09-10  Kael:
 
 TODO:
 - A. test runtimeStyle, ref:
 	http://lists.w3.org/Archives/Public/www-style/2009Oct/0060.html
 	http://msdn.microsoft.com/en-us/library/ms535889(v=vs.85).aspx
 - B. computedStyle for width and height
 - C. test margin-right
 
 2011-09-09  Kael:
 - complete basic css methods
 - create getter and setter method for opacity in old ie

 */