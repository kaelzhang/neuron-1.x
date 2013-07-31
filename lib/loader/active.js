/**
 * @preserve Neuron core:loader v5.0.1(active mode)
 * author i@kael.me 
 */
 
/**
 
 which is ifferent from loader in passive mode, 
 active loader will automatically parse dependencies and load them into the current page.
 */

; // fix layout of UglifyJS

/**
 * include
 * X - static resource loader
 * - a commonjs module loader
 * - interface for business configuration
 
 * implements
 * - CommonJS::Modules/Wrappings                        >> http://kael.me/-cmw
 * - CommonJS::Modules/Wrappings-Explicit-Dependencies    >> http://kael.me/-cmwed
 
 * Google closure compiler advanced mode strict
 */

/**
 * @param {undefined=} undef
 */
;(function(K, NULL, undef){

/**
 * stack, config or flag for modules
 */
var    

/**
 * map -> identifier: module
 */
_mods = {},            

/**
 * map -> url: status
 */
_script_map = {},

/**
 * map -> namespace: config
 */
// _apps_map = {},

_last_anonymous_mod = NULL,

// fix onload event on script node in ie6-9
use_interactive = K.UA.ie, // < 10,
interactive_script = NULL,

// @type {function()}
// warning,
error,

Loader = {},
    
/**
 * @const
 */
// ex: `~myModule`
// USER_MODULE_PREFIX = '~',
APP_HOME_PREFIX = '~/',

// ex: Checkin::index
APP_NAMESPACE_SPLITTER = '::',

// REGEX_FILE_TYPE = /\.(\w+)$/i,

/**
 * abc             -> js: abc.js        
 * abc.js         -> js: abc.js
 * abc.css        -> css: abc.css
 * abc#            -> js: abc
 * abc?123        -> js: abc?123
 * abc?123.js    -> js: abc?123.js
 * abc?123.css    -> css: abc?123.css
 */
REGEX_NO_NEED_EXTENSION = /\.(?:js|css)$|#|\?/i,
REGEX_IS_CSS = /\.css(?:$|#|\?)/i,

/**
 * abc/def        -> abc
 */
REGEX_DIR_MATCHER = /.*(?=\/.*$)/,

// no operation
NOOP = function(){},

HOST = K.__HOST,
DOC = HOST.document,
HEAD = DOC.getElementsByTagName('head')[0],

getLocation = K.getLocation,

/**
 * module status
 * @enum {number}
 * @const
 */    
STATUS = {
    // the module's uri has been specified, 
    // DI -> DEFINING
    DI    : 1,

    // the module's source uri is downloading or executing
    // LD -> LOADING
    LD    : 2,
    
    // the module has been explicitly defined. 
    // DD -> DEFINED
    DD     : 3,
    
    // being analynizing and requiring the module's dependencies
    // RQ -> REQUIRING
    RQ     : 4,
    
    // the module's factory function are ready to be executed
    // the module's denpendencies are set as STATUS.RD
    // RD -> READY
    RD     : 5 //,
    
    // the module already has exports
    // the module has been initialized, i.e. the module's factory function has been executed
    // ATTACHED      : 6
},

asset = K.load;


/**
 Parameter naming:

 name           : a generic name which might be mixed types of values
 identifier     : module identifier just, such as 'io/ajax', also including relative identifiers, such as './jsonp'
 pathname       : pathname
 uri            : identifier name or url
 urn            : name of module identifier
 
 
 Object attributes:
 i      : abbr for identifier
 u      : abbr for url
 fu     : full url with contains decorations such as `.min` and `.v21`
 p      : parent or path
 ns     : namespace
 n      : urn
 m      : mod

 */

/**
 * module define
 * --------------------------------------------------------------------------------------------------- */

/**
 * method to define a module
 * @public
 * @param {string=} path pathname of the module file
 * @param {(Array.<string>|string)=} dependencies array of module names
 * @param {(function()|Object)=} factory
 *      {function}     the factory of a module
 *      {object}     module exports
 */
function define(path, dependencies, factory){
    // overload and tidy arguments 
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    if(!K.isString(path)){                  // -> define(dependencies, factory);
        factory = dependencies;
        dependencies = path;
        path = undef;
    }
    
    if(!K.isArray(dependencies)){           // -> define(factory);
        if(dependencies){
            factory = dependencies;
        }
        dependencies = undef;
    }

    if(path){

        // '/' -> backward legacy
        // NR.define('lib/1.0/a.js', ...);
        path = generateModulePath( moduleNameToPath(path, undef, '/') );
    }
    
    _define(path, dependencies, factory);
};


/**
 * method for inner use
 * @private
 
 * @param {string=} path pathname of the module file
 * @param {(Array.<string>)=} dependencies
 * @param {(function(...[number])|Object)=} factory
 */
function _define(path, dependencies, factory){

    var 
    
    mod = {},
    path_info,
    existed,
    active_script_uri;

    // anonymous module define
    if(!path){
        // via Kris Zyp
        // Ref: http://kael.me/-iikz
        if (use_interactive) {
            
            // Kael: 
            // In IE(tested on IE6-9), the onload event may NOT be fired 
            // immediately after the script is downloaded and executed
            // - it occurs much late usually, and especially if the script is in the cache, 
            // So, the anonymous module can't be associated with its javascript file by onload event
            // But, always, onload is never fired before the script is completed executed
            
            // demo: http://kael.me/TEMP/test-script-onload.php
            
            // > In IE, if the script is not in the cache, when define() is called you 
            // > can iterate through the script tags and the currently executing one will 
            // > have a script.readyState == "interactive" 
            active_script_uri = getInteractiveScript()
            
                // Kael:
                // if no interactive script, fallback to asset.__pending
                // if the script is in the cache, there is actually no interactive scripts when it's executing
                || {};
                
            active_script_uri = active_script_uri.src
                
                // > In IE, if the script is in the cache, it actually executes *during* 
                // > the DOM insertion of the script tag, so you can keep track of which 
                // > script is being requested in case define() is called during the DOM 
                // > insertion.            
                || asset.__pending;
        }
        
        if(!active_script_uri){
            // if fetching interactive script failed, or not ie
            // fall back to normal ways
            _last_anonymous_mod = mod;

        }else{
            mod = getModuleByPath( Loader.santitize( getLocation(active_script_uri).pathname ) );
        }
    }
    
    switch(K._type(factory)){
        
        // define(deps, factory);
        // define(factory);
        case 'function':
            mod.f = factory;
            
            // if dependencies is explicitly defined, loader will never parse them from the factory function
            // so, to define a standalone module, you can set dependencies as []
            
            // if(!dependencies){
            //    dependencies = parseDependencies(factory);
            // }
            
            if(dependencies && dependencies.length){
                mod.s = STATUS.DD;
                
                // only if defined with factory function, can a module has dependencies
                mod.deps = dependencies;
            }else{
                mod.s = STATUS.RD;
            }
            
            break;
            
        // define(exports)
        case 'object':
            mod.exports = factory;
            
            // tidy module data, when fetching interactive script succeeded
            active_script_uri && tidyModuleData(mod);
            uri = NULL;
            break;
    }
    
    if(path){
        existed = getModuleByPath(path);
        existed ? ( mod = K.mix(existed, mod) ) : registerMod(path, mod);
        mod.i = path;
    }
    
    // internal use
    return mod;
};


/**
 * module load
 * --------------------------------------------------------------------------------------------------- */
 
/**
 * method to load a module
 * @public
 * @param {Array.<String>} dependencies
 * @param {(function(...[number]))=} callback (optional)
 */
function provide(dependencies, callback){
    dependencies = K.makeArray(dependencies);
    
    _provide(dependencies, callback, {});
}; 


/**
 * @private
 * @param {Object} env environment for cyclic detecting and generating the uri of child modules
     {
         r: {string} the uri that its child dependent modules referring to
         p: {string} the uri of the parent dependent module
         n: {string} namespace of the current module
     }
 * @param {boolean=} noCallbackArgs whether callback method need arguments, for inner use
 */
function _provide(dependencies, callback, env, noCallbackArgs){
    var 

    counter = dependencies.length,
    args = [K],
    arg_counter = 0,
    cb;
        
    if(K.isFunction(callback)){
        cb = noCallbackArgs ?
            callback
        : 
            function(){
                callback.apply(NULL, args);
            };
    }
        
    if(counter === 0){
        cb && cb();
    }else{
        for_each(dependencies, function(dep, i){
            var mod = getOrDefine(dep, env),
                arg_index = mod.isCSS ? 0 : ++ arg_counter;
            
            // if(isCyclic(env, mod.u)){
            //     warning(120);
            // }
            
            provideOne(mod, function(){
                if(cb){
                    -- counter;
                
                    if(!noCallbackArgs && arg_index){
                        args[arg_index] = createRequire(env)(dep);
                    }
                    
                    if(counter === 0){
                        cb();
                    }
                }
            }, mod);
        });
    }
};


/**
 * @private
 * @param {string} urn
 * @param {object=} env
 * - i: {string} pathname of env module
 * - ns: {string} namespace
 */
function getOrDefine(urn, env){
    var 
    
    referencePath = env.i,
       
    // module data
    mod,
    
    name = urn,
        
    // app data                      
    namespace,
    namesplit = urn.split(APP_NAMESPACE_SPLITTER),
    is_app_home_module,
    home_prefix = APP_HOME_PREFIX,
    
    uri, path;
    
    // -> 'index::common'
    if(namesplit[1]){
        name = namesplit[1];                            // -> 'common'
        namespace = namesplit[0].toLowerCase();         // -> 'index'
    }
        
    
    // in [Checkin::index].js
    // ex: '~/dom' 
    //     -> name: 'dom', namespace: 'Checkin'
    if(is_app_home_module = name.indexOf(home_prefix) === 0){
        name = name.substr(home_prefix.length);
    }
    
    // these below are treated as modules within the same namespace
    // '~/dom'
    // './dom'
    // '../dom'
    if(is_app_home_module || isRelativePath(name)){
        namespace = env.ns;
    }

    uri = moduleNameToPath(
        name, 
        referencePath,
        // if has namespace, then the base location is app home
        namespace && Loader.appBase + namespace + '/'
    );
    
    path = generateModulePath(uri);
    mod = getModuleByPath(path);
    // warn = warn && !mod;
    
    if(!mod){
        // always define the module url when providing
        mod = _define(path);
        mod.s = STATUS.DI;

        if(REGEX_IS_CSS.test(path)){
            mod.isCSS = true;
        }
    }
    
    if(namespace){
        mod.ns = namespace;
    }
    
    return mod;
};


/**
 * provideOne(for inner use)
 * method to provide a module, push its status to at least STATUS.ready
 * @param {Object} mod
 * @param {function()} callback
 * @param {!Object} env sandbox of environment {
         r: {string} relative uri,
         p: {Object} environment of the parent module(caller module which depends on the current 'mod' ),
         n: {string} namespace of the caller module
   }
 */
function provideOne(mod, callback, env){
    var status = mod.s, 
        parent, cb,
        _STATUS = STATUS;
    
    // Ready -> 5
    // provideOne method won't initialize the module or execute the factory function
    if(mod.exports || status === _STATUS.RD){
        callback();
    
    }else if(status >= _STATUS.DD){
        cb = function(){
            var ready = _STATUS.RD;
            
            // function cb may be executed more than once,
            // because a single module might be being required by many other modules simultainously.
            // after a certain intermediate process, maybe the module has been initialized and attached(has 'exports') 
            // and its status has been deleted.
            // so, mod.s must be checked before we set it as 'ready'
            
            // undefined < ready => false
            if(mod.s < ready){
                mod.s = ready;
            }
            
            callback();
        };
    
        // Defined -> 3
        if(status === _STATUS.DD){
            mod.s = _STATUS.RQ;
            mod.pending = [cb];
            
            // recursively loading dependencies
            _provide(mod.deps, function(){
                var m = mod;
                for_each(m.pending, function(c){
                    c();
                });
                
                m.pending.length = 0;
                delete m.pending;
            }, env, true);
            
        // Requiring -> 4
        }else{
            mod.pending.push(cb);
        }
    
    }else if(status < _STATUS.DD){
        loadModuleSrc(mod, function(){
            var last = _last_anonymous_mod;
            
            // CSS dependency
            if(mod.isCSS){
                mod.s = _STATUS.RD;
                delete mod.u;
            
            // Loading -> 2
            // handle with anonymous module define
            }else if(last && mod.s === _STATUS.LD){
                
                if(last.s < _STATUS.DD){
                    error(510);
                }
                
                K.mix(mod, last);
                _last_anonymous_mod = NULL;
                
                // when after loading a library module, 
                // and IE didn't fire onload event during the insertion of the script node
                tidyModuleData(mod);
            }
            
            provideOne(mod, callback, env);
        });
    }
};


/**
 * specify the environment for every id that required in the current module
 * including
 * - reference uri which will be set as the current module's uri 
 
 * @param {Object} envMod mod
 */
function createRequire(envMod){
    return function(id){
        var mod = getOrDefine(id, envMod);
        
        return mod.exports || generateExports(mod);
    };
};


/**
 * generate the exports if the module status is 'ready'
 */
function generateExports(mod){
    var exports = {};
    var module = {
            exports: exports
        };
    var factory;
    var ret;
        
    if(mod.s === STATUS.RD && K.isFunction(factory = mod.f) ){
    
        // to keep the object mod away from the executing context of factory,
        // use factory instead mod.f,
        // preventing user from fetching runtime data by 'this'
        ret = factory(K, createRequire(mod), exports, module);
        
        // backward legacy
        if(ret){
            module.exports = ret;
        }
        
        mod.exports = module.exports;
        tidyModuleData(mod);
    }
        
    return mod.exports;
};


function tidyModuleData(mod){
    if(mod.exports){
        // free
        // however, to keep the code clean, 
        // tidy the data of a module at the final stage instead of at each intermediate process
        if(mod.deps){
            mod.deps.length = 0;
            delete mod.deps;
        }
        
        delete mod.f;
        delete mod.s;

        // never delete `mod.i` or `mod.ns`, coz `require` method might be executed after module factory executed
        // delete mod.i
        // delete mod.ns;

        delete mod.p;
    }
    
    return mod;
};


/**
 * load a script and remove script node after loaded
 * @param {string} uri
 * @param {function()} callback
 * @param {!string.<'css', 'js'>} type the type of the source to load
 */
function loadScript(uri, callback, type){
    var node,
        cb = type === 'css' ? callback : function(){
        
            // execute the callback before tidy the script node
            callback.call(node);
    
            if(!isDebugMode()){
                try {
                    if(node.clearAttributes) {
                        node.clearAttributes();
                    }else{
                        for(var p in node){
                            delete node[p];
                        }
                    }
                } catch (e) {}
                
                HEAD.removeChild(node);
            }
            node = NULL;
        };
    
    node = asset[ type ](uri, cb);
};


/**
 * load the module's resource file
 * always load a script file no more than once
 */
function loadModuleSrc(mod, callback){
    var path = mod.i;
    var uri = Loader.getURI(path);

    var script = _script_map[uri];
    var LOADED = 1;
        
    if (!script) {
        script = _script_map[uri] = [callback];
        mod.s = STATUS.LD;
        
        loadScript(uri, function(){
            var m = mod;
                
            for_each(script, function(s){
                s.call(m);
            });
            
            // TODO:
            // test
            // _script_map[uri] = LOADED;
            
            // the logic of loader ensures that, once a uri completes loading, it will never be requested 
            // delete _script_map[uri];
        }, mod.isCSS ? 'css' : 'js');
        
    } else {
        script.push(callback);
    }    
};


/**
 * module tools
 * --------------------------------------------------------------------------------------------------- */

/**
 * @param {string} name
 * @param {string=} referencePath
 * @param {string=} base default to libBase
 * @return {string} module uri (exclude server)
 */
function moduleNameToPath(name, referencePath, base){
    var no_need_extension = REGEX_NO_NEED_EXTENSION.test(name);
    return applyRelativePath(name + (no_need_extension ? '' : '.js'), referencePath, base);
};


/**
 * generate the path of a module, the path will be the identifier to determine whether a module is loaded or defined
 * @param {string} uri the absolute uri of a module. no error detection
 */
function generateModulePath(path){
    return isAbsolutePath(path) ?
        
        // /lib/io/ajax.js'
        path :
        
        // convert loader path (exclude server) to absolute url
        // url -> '/lib/io/ajax.js'
        Loader.applyPath(path);
};

/**
 * get a module by id
 * @param {string=} version
 */
function getModuleByPath(path){
    return _mods[path];
};


function registerMod(path, mod){
    _mods[path] = mod;
};


// function isCyclic(env, uri) {
//     return uri && ( env.u === uri || env.p && isCyclic(env.p, uri) );
// };


function getInteractiveScript() {
    var INTERACTIVE = 'interactive';

    if (interactive_script && interactive_script.readyState === INTERACTIVE) {
        return interactive_script;
    }
    
    // DP loader only insert scripts into head
    var scripts = HEAD.getElementsByTagName('script'),
        script,
        i = 0,
        len = scripts.length;
    
    for (; i < len; i++) {
        script = scripts[i];
            if (script.readyState === INTERACTIVE) {
            return interactive_script = script;
        }
    }
    
    return NULL;
};


function isDebugMode(){
    return K._env.debug;
};


/**
 * data santitizer
 * --------------------------------------------------------------------------------------------------- */

/**
 * the reference uri for a certain module is the module's uri
 * @param {string=} referencePath
 * @param {string=} base default to libBase
 */
function applyRelativePath(path, referencePath, base){
    var ret;
    
    base || (base = Loader.libBase);
    referencePath || (referencePath = base);
    
    // absolute uri
    if (isAbsolutePath(path)) {
        ret = path;
        
    // relative uri
    }else if (isRelativePath(path)) {
        ret = realpath(getDir(referencePath) + path);
        
    /**
     * Neuron Loader will never apply the root base of current location.href to current modules
     * module base must be configured
     */
    }else {
        ret = base + path.replace(/^\/+/, '');
    }
    
    return ret;
};


function isAbsolutePath(path){
    return path && path.indexOf('/') === 0;
};


function isRelativePath(path){
    return path.indexOf('./') === 0 || path.indexOf('../') === 0;
};


/**
 * Canonicalize path.
 
 * realpath('a/b/c') ==> 'a/b/c'
 * realpath('a/b/../c') ==> 'a/c'
 * realpath('a/b/./c') ==> '/a/b/c'
 * realpath('a/b/c/') ==> 'a/b/c/'
 * #X realpath('a//b/c') ==> 'a/b/c' ?
 * realpath('a//b/c') ==> 'a//b/c'   - for 'a//b/c' is a valid uri
     -> http://jsperf.com/memoize
 */
function realpath(path) {
    var old = path.split('/'),
        ret = [];
        
    for_each(old, function(part, i){
        if (part === '..') {
            if (ret.length === 0) {
                  error(530);
            }
            ret.pop();
            
        } else if (part !== '.') {
            ret.push(part);
        }
    });
    
    return ret.join('/');
};


/**
 * get the current directory from the location
 *
 * http://jsperf.com/regex-vs-split/2
 * vs: http://jsperf.com/regex-vs-split
 */
function getDir(uri){
    var m = uri.match(REGEX_DIR_MATCHER); // greedy match
    return (m ? m[0] : '.') + '/';
};


/**
 * @lang
 * ---------------------------------------------------------------------------------- */

function for_each(arr, fn){
    var i = 0,
        len = arr.length;
        
    for(; i < len; i ++){
        fn.call(arr, arr[i], i, arr);
    }
};


/**
 * @public
 * ---------------------------------------------------------------------------------- */

define.__mods = _mods;


// use extend method to add public methods, 
// so that google closure will NOT minify Object properties

// define a module
K['define'] = define;

// attach a module
K['provide'] = provide;

// semi-private
// will be destroyed after configuration
K.__loader = Loader;


})(DP, null);


/**
 change log:
 
 import ./ChangeLog.md;
 
 