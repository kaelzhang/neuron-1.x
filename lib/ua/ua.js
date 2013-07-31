/**
 * user agent
 * author  Kael Zhang
 */
 
(function(K){

	// @namespace DP.UA 
var UA = K.UA = {},
    NULL = null,
    FP_VERSION_REG = /[A-Za-z\s]+/g,
    FLASH_PLUGIN_NAME = 'ShockwaveFlash',
	// @enum {RegExp}
	REGEX_UA_MATCHER = {
	
		// the behavior of Google Chrome, Safari, Maxthon 3+, 360 is dependent on the engine they based on
		// so we will no more detect the browser version but the engine version
		
		// DP.UA.chrome and DP.UA.safari are removed
		webkit	: /webkit[ \/]([^ ]+)/,
		opera	: /opera(?:.*version)?[ \/]([\w.]+)/,
		ie		: /msie ([\w.]+)/,
		mozilla	: /mozilla(?:.*? rv:([\w.]+))?/
	},
	
	DEFAULT_PLATFORM = 'other',
    fpVersion=NULL,
	userAgent = navigator.userAgent.toLowerCase(),
	platform = navigator.platform.toLowerCase();


// userAgent
['webkit', 'opera', 'ie', 'mozilla'].forEach(function(name){
	var ua = UA;

	if(!ua.version){
		var match = userAgent.match(REGEX_UA_MATCHER[name]);
			
		if(match){
			ua[name] = ua.version = parseInt(match[1]);
			UA.fullVersion = match[1];	
		}
	}
});


UA.platform = platform = platform.match(/ip(?:ad|od|hone)/) ? 'ios' 
	: ( platform.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || [DEFAULT_PLATFORM] )[0];


if(platform !== DEFAULT_PLATFORM){
	UA[platform] = true;
}

function makeInt(n) {
    return n>>>0;
}
/**
 * parse version
 * @param flashVer
 * @returns {Object}
 *  <code>
 *      vers = {major: 11, minor: 0, revision: 11}
 *  </code>
 */
function parseFlashVersion(flashVer) {
    var vers = {},
        major = makeInt(flashVer[0]),
        minor = makeInt(flashVer[1]),
        revision = makeInt(flashVer[2]);

    vers.major = major;
    vers.minor = minor;
    vers.revision = revision;

    return vers;
}

//parse platform information, to get version of flashplayer
function getFlashVersion() {
    var mF, eP, vS, ax, vS, fpVersion;
    if (UA.ie) {
        // flash ver 7 or higher version
        try {
            ax = new ActiveXObject(FLASH_PLUGIN_NAME + "." + FLASH_PLUGIN_NAME + ".7");
            vS = ax.GetVariable("$version");
        } catch (e) {
            //not check failed case here, to avoid deep context
        }
        // lower version
        if (!vS) {
            try {
                // version will be set for 6.X players only
                ax = new ActiveXObject(FLASH_PLUGIN_NAME + "." + FLASH_PLUGIN_NAME + ".6");

                // installed player is some revision of 6.0
                // GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
                // so we have to be careful.

                // default to the first public version
                vS = "WIN 6,0,21,0";

                // throws if AllowScripAccess does not exist (introduced in 6.0r47)
                ax.AllowScriptAccess = "always";

                // safe to call for 6.0r47 or greater
                vS = ax.GetVariable("$version");

            } catch (e) {
                fpVersion = NULL;
            }
        }
        vS && (fpVersion = parseFlashVersion(vS.replace(/[A-Za-z\s]+/g, '').split(',')));
    } else {
        if ((mF = navigator.mimeTypes['application/x-shockwave-flash'])) {
            if ((eP = mF.enabledPlugin)) {
                vS = eP.description.replace(/\s[rd]/g, '.').replace(FP_VERSION_REG, '').split('.');
                fpVersion = parseFlashVersion(vS);
            }
        }
    }
    return fpVersion;
};
/**
 * get version of flashplayer
 * @returns {Object}
 * <code>
 *     {
 *         major: 11,  // major version
 *         minor: 0,    //minor version
 *         revision:12 //revision version
 *     }
 * </code>
 */
UA.getFlashVersion = function (){
    return fpVersion || (fpVersion=getFlashVersion());
}

})(DP);


/**
 change log:
 
 2011-09-03  Kael Zhang:
 - create file
 - remove DP.UA.chrome and DP.UA.safari
 2011-06-13 xuwei.chen
 - add UA.getFlashVersion
 */