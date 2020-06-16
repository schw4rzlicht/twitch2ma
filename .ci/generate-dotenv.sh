#!/usr/bin/env bash

if [[ "$1" = "undefined" ]]
then
    echo "Posting production to .env"   # DEBUG
    echo "NODE_ENV=production" > .env
else
    echo "Posting staging to .env"      # DEBUG
    echo "NODE_ENV=staging" > .env
fi
