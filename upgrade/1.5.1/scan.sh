#!/bin/bash

cwd=$1

for js in $(find "$cwd" | grep .js)
do
    if [[ ${js: -3} == ".js" ]]; then
        node scan.js "$js"
    fi
done