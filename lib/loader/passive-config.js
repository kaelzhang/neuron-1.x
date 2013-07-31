;(function(K){


var host = K.__HOST;

/**
 * @param {Object=} conf {
	 	base: 				{string} root "path" of module library
	 	allowUndefinedMod: 	{boolean}
	 	enableCDN:			{boolean}
	 	CDNHasher: 			{function}
	 }
 */
K.__loader.config(K.mix({
	// root path of module files
	// libBase: 'lib/',
	// appBase: 's/j/app/',
	
	warning: host.console && console.warn ?
		function(msg){
			console.warn('DP Loader: ' + msg);
		}
		: NOOP,
	
	/**
	 * custom error type
	 * @constructor
	 */
	error: function loaderError(message){
		throw {
			message:	message,
			toString:	function(){
				return 'DP Loader: ' + message;
			}
		};
	}
	
}, host.__loaderConfig));


})(DP);