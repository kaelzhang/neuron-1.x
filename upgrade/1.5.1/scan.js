'use strict';

var node_fs = require('fs');
var uglifyjs = require('uglify-js');
var get_deps = require('./deps');

var file = process.argv[2];

if(/[a-z0-9]{32}\.js$/.test(file)){
    return;
}

console.log('file', file);

function check(deps){
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


// node scan.js xxxx.js
var content = node_fs.readFileSync(file);

var ast = uglifyjs.parse(content.toString());

var walker = new uglifyjs.TreeWalker(function (node) {
    var deps = get_deps(node);

    if(deps){
        check(deps);
    }
});

ast.walk(walker);