#!/bin/bash

cwd=$1

echo $cwd

for js in $(find "$cwd" | grep .js)
do
    node scan.js "$js"
done