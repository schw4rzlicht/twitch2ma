#!/usr/bin/env bash

set -a
source .env
set +a

curl -sL https://sentry.io/get-cli/ | bash

export SENTRY_RELEASE=$1

sentry-cli releases new -p $SENTRY_PROJECT $SENTRY_RELEASE
sentry-cli releases set-commits $SENTRY_RELEASE --auto
sentry-cli releases files $SENTRY_RELEASE upload-sourcemaps dist
sentry-cli releases finalize $SENTRY_RELEASE
sentry-cli releases deploys $SENTRY_RELEASE new -e $NODE_ENV
