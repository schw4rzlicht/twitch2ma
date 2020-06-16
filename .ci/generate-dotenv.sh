#!/usr/bin/env bash

if [[ -z "$1" ]]
then
    echo "NODE_ENV=production" > .env
else
    echo "NODE_ENV=staging" > .env
fi
