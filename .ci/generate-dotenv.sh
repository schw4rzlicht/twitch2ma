#!/usr/bin/env bash

if [[ "$1" = "undefined" ]]
then
    echo "NODE_ENV=production" > .env
else
    echo $1
    echo "NODE_ENV=staging" > .env
fi
