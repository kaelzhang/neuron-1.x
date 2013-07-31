/**
 * Creates specified namespace if it doesn't exist 

 * <code>
 *    DP.namespace('widget.Logger'); // returns DP.widget.Logger
 *    DP.namespace('DP.widget.Logger'); // returns DP.widget.Logger
 * </code>

 * @return {Object} current app namespace
 */
DP.namespace = function(){
    var args = arguments, self = DP, h = self.__HOST,
        root = null,

        i = 0, i_len = args.length,
        j, j_len,

        ns;
        
    for(; i < i_len; i ++ ){
        ns = ('' + args[i]).split('.');
		root = self;
        j_len = ns.length;

        for(j = (h[ns[0]] === self ? 1 : 0); j < j_len; j ++){
            root[ns[j]] = root[ns[j]] || {};
            root = root[ns[j]];
        }
    }

    return root;
};