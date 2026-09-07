#!/usr/bin/env sh
set -eu

JAVA_BIN="${JAVA_BIN:-java}"
MIN_MEMORY="${MIN_MEMORY:-1024M}"
MAX_MEMORY="${MAX_MEMORY:-6024M}"

exec "$JAVA_BIN" -Xms"$MIN_MEMORY" -Xmx"$MAX_MEMORY" -jar minecraft_server.jar nogui "$@"
