#!/bin/bash

cwd=$1

find "$cwd" | grep .js > list.txt

node scan.js