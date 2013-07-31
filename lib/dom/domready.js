/**
 * module  web/domready
 * author  Kael Zhang
 */
 

// TODO!!!!!  complete event
 

;(function(K, undef){


/**
 * Custom domready event
 * @private
 * ----------------------------------------------------------------------------------------------------------- */

function domready(){

	// fire domready only once
	if(!is_domready){
		is_domready = true;
		fire_domready();
	}
}

function fire_domready(){
	var self = this,
		r = readyList, fn;
		
	if(r){	
		for(var i = 0, len = r.length; i < len; i ++){
			fn = r[i]
			fn && fn.call(WIN, K);
		}

		r.length = 0;
		readyList = null;
	}
};


function bind_domready(){

	function poll_scroll(){
		try {
			// doScroll technique by Diego Perini http://javascript.nwbox.com/IEContentLoaded/
			doScroll('left');
			ready();
		} catch(ex) {
			setTimeout(poll_scroll, 10);
		}
	};
	
	function _ready(){
		_doc.off(eventType, _ready);
        _win.off('load', _ready);
		_doc = _win = null;
		domready();
	};

	var COMPLETE = 'complete', doc = WIN.document,
		doScroll = doc.documentElement.doScroll,
		eventType = doScroll ? 'readystatechange' : 'DOMContentLoaded',
		_doc = new DOM(doc),
        _win = new DOM(WIN);
		
	is_domready_binded = true;
	
	// Catch cases where ready() is called after the
	// browser event has already occurred.
	if(doc.readyState === COMPLETE) return domready();
	
	_doc.on(eventType, _ready);
	
	// A fallback to load
	// and make sure that domready event fires before load event registered by user
	_win.on('load', _ready);
	
	if(doScroll){
		var not_framed = false;
		
		try {
			not_framed = win.frameElement == null;
		} catch(e) {}
		
		if(not_framed){
			poll_scroll();
		}
	}
};


var is_domready = false,
	is_domready_binded = false,
    is_loaded = false,
    
    DOM = K.DOM,
	
    readyList = [],

	// @const
	WIN = K.__HOST;
    

K.isDomReady = function(){
	return is_domready;
};
	
K.isLoaded = function(){
	return is_loaded;
};
	
/**
 * the entire entry for domready event
 * window.addEvent('domready', fn) has been carried here, and has no more support
 * @param {function()} fn the function to be executed when dom is ready
 */
K.ready = function(fn){
	// delay the initialization of binding domready, making page render faster
	is_domready_binded || bind_domready();
	
	if(is_domready){
		fn.call(WIN, this);
	}else{
		readyList.push(fn);
	}
};


})(DP);

/**
 2011-09-04  Kael Zhang:
 - split domready alone
 - migrate event handler from mootools to Neuron
 
 2011-04-12  Kael Zhang:
 - fix a bug that domready could not be properly fired
 	
 2010-12-31  Kael Zhang:
 - migrate domready event out from mootools to here, and change some implementations
 
 */