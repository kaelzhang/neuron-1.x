/**
 * @module  config
 * global configurations:
 * - loader config
 		- cdn
 		- santitizer
 		- module base
 		- warning config
 * - evironment config
 		- debug mode
 		X - global dom parser
 */
 

;(function(K){


function CDNHasher(evidence, isLibMod){
    var s = isLibMod ? server : appServer;

	return 'http://' + K.sub(s, {n: evidence.length % 3 + 1});
};


function applyPath(path, isLibMod){
    return (isLibMod ? libBase : appBase) + path;
};


var REGEX_PATH_CLEANER_MIN      = /\.min/i;
var REGEX_PATH_CLEANER_MD5      = /\.[a-z0-9]{32}/i;
var REGEX_PATH_CLEANER_VERSION  = /\.v(?:\d+\.)*\d+/i;

function santitize(identifier){
	return identifier.replace(REGEX_PATH_CLEANER_MIN, '').replace(REGEX_PATH_CLEANER_MD5,'').replace(REGEX_PATH_CLEANER_VERSION, '');
};

var REGEX_REPLACE_EXTENSION = /\.[a-z0-9]+$/;


var debug_mode = ~ document.cookie.indexOf('neuron-debug');
var timestamp = Date.now();

function getURI(path){
    var server = path.indexOf(libBase) === 0 ? libServer : appServer;

    var product_path = path;

    if( !debug_mode && (md5 = urls[path]) ){
        if(combos[md5]){
            product_path = combos[md5];
        }else{
            product_path = path.replace(REGEX_REPLACE_EXTENSION, function (extension) {
                return '.min.' + md5 + extension;
            });
        }
    }else{
        product_path += '?' + timestamp;
    }

    return 'http://' + server.replace(/\{n\}/g, product_path.length % 3 + 1) + product_path;
};

function loaderError(message){
	throw {
		message:	message,
		toString:	function(){
			return 'DP Loader: ' + message;
		}
	};
};

var provide         = K.provide;

var pendingQueue    = [];
var __config        = window.__loaderConfig || {};


var server          = __config.server;
var appServer       = __config.appServer    || server;
var libServer       = __config.libServer    || server;
var libBase         = '/' + (__config.libBase      || 'lib/1.0');
var appBase         = '/' + (__config.appBase      || 's/j/app');
var urls = {};
var combos = {};


if(libBase === appBase){
    loaderError('libBase same as appBase, which is forbidden');
}


/**
 * before module-version.js is downloaded and executed,
 * DP.provide temporarily does nothing but push the action into a pending queue
 */
K.provide = function(){
	pendingQueue.push(arguments);
};



var Loader = K.__loader;

Loader.applyPath    = applyPath;
Loader.santitize    = santitize;
Loader.appBase      = appBase;
Loader.libBase      = libBase;
Loader.getURI       = getURI;

// Loader.init will be called at the end of module-version.js
// @param {Object} url_map
// {
//     <path>: <md5>
// }

// @param {Array} combo_map
// {

// }
Loader.init = function(url_map, combo_map){
    if(arguments.length === 2){
        urls = url_map;
        combos = combo_map;
    }

    K.provide = provide;
    
    pendingQueue.forEach(function(args){
        provide.apply(null, args);
    });

    delete K.__loader;
};


})(DP);