#!/usr/bin/env bash

echo "notify-sentry.sh started!"                    # DEBUG

set -a
source .env
set +a

curl -sL https://sentry.io/get-cli/ | bash

export SENTRY_RELEASE=$1

echo "Content of SENTRY_RELEASE: $SENTRY_RELEASE"   # DEBUG
echo "Content of NODE_ENV: $NODE_ENV"               # DEBUG

sentry-cli releases new -p $SENTRY_PROJECT $SENTRY_RELEASE
sentry-cli releases set-commits $SENTRY_RELEASE --auto
sentry-cli releases files $SENTRY_RELEASE upload-sourcemaps dist
sentry-cli releases finalize $SENTRY_RELEASE
sentry-cli releases deploys $SENTRY_RELEASE new -e $NODE_ENV
