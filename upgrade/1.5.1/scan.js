'use strict';

var node_fs = require('fs');
var uglifyjs = require('uglify-js');
var get_deps = require('./deps');


var parser = {
    parse: function (path) {
        parser.path = path;

        console.log('file', path);

        try {
            // node scan.js xxxx.js
            var content = node_fs.readFileSync(path);
            var ast = uglifyjs.parse(content.toString());
            ast.walk(parser.walker);
        } catch(e) {
            
        }
    },

    walker: new uglifyjs.TreeWalker(function (node) {
        var deps = get_deps(node);

        if(deps){
            parser.check(deps);
        }
    }),

    check: function(deps){
        var file = parser.path;

        console.log('check deps', deps);

        deps.some(function (dep) {
            var name;

            if( ~ dep.indexOf('::') ){
                name = dep.split('::')[1];
            }else{
                name = dep;
            }

            if( name.indexOf('/') === 0 ){
                console.log('invalid identifier');
                node_fs.writeFileSync('scan.log', file + '\n');
            }
        });
    }
}


var files = node_fs.readFileSync( 'list.txt' ).toString().split( /\r|\n/g );

files.filter(function (path) {
    return /\.js$/.test(path) && !/[a-z0-9]{32}\.js$/.test(path);

}).forEach(function (path) {
    parser.parse(path);
});




