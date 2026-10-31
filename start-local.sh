#!/bin/sh
set -eu
SKY_PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if ! command -v node >/dev/null 2>&1; then
    printf '%s\n' 'Node.js is required. Install the LTS version from https://nodejs.org/'
    exit 1
fi
exec node "$SKY_PROJECT_DIR/tools/dev-server.cjs" "$@"
