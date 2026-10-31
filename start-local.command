#!/bin/sh
SKY_PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec sh "$SKY_PROJECT_DIR/start-local.sh" "$@"
