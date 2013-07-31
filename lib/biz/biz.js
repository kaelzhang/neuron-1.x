/**
 * module  biz
 * method for business requirement
 */

;(function(K){

// --- method for DP.data ----------------------- *\
function setData(data){
	data && K.mix(stored_data, data);
};

function cloneData(){
	return K.clone(stored_data);
};

function getData(name){
	return stored_data[name];
};
// --- /method for DP.data ----------------------- *\


	// @type {Object}
var stored_data = {},
	undef;


/**
 * module  data

 * setter
 * getter

 * usage:
 * 1. DP.data()                     returns the shadow copy of the current data stack
 * 2. DP.data('abc')                returns the data named 'abc'
 * 3. DP.data('abc', 123)           set the value of 'abc' as 123
 * 4. DP.data({abc: 123, edf:456})  batch setter
 *
 * @param {all=} value 
 */
K.data = function(name, value){
	var type = K._type(name),
		empty_obj = {},
		is_getter, ret;
	
	if(name === undef){
		ret = cloneData(); // get: return shadow copy
		is_getter = true;

	}else if(type === 'string'){
		if(value === undef){
			ret = getData(name); // get: return the value of name
			is_getter = true;
		}else{
			empty_obj[name] = value;
			setData(empty_obj) // set
		}

	}else if(type === 'object'){
		setData(name); // set
	}

	return is_getter ? ret : K;
};


/**
 * attach a module for business requirement, for configurations of inline scripts
 * if wanna a certain biz module to automatically initialized, the module's exports should contain a method named 'init'
 */
K.require = function(){
	var isString = K.isString;
	
	K.makeArray(arguments).forEach(function(module){
		if(isString(module)){
			module = {
				mod: module
			};
		}
		
		K.provide(module.mod, function(K, method){
			method.init && method.init(module.config);
		});
	});
};


})(DP);


/**
 change log:
 
 2012-02-08  Kael:
 - use DP.require instead of DP.bizRequire, and no longer initialize modules after DOMReady by default. 
 	Modules loaded by DP.require should manage DOMReady by their own if necessary.
 
 2011-10-13  Kael:
 - move DP.data to biz.js
 - add DP.bizRequire method to automatically provide a batch of specified modules
 
 TODO:
 A. add a method to fake a global function to put its invocations into a queue until the real implementation attached
 
 */