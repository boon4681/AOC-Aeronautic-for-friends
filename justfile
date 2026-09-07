[windows]
set shell := ["C:/Program Files/Git/bin/sh.exe", "-cu"]
set positional-arguments := true

pakku *args:
    @java -jar pakku.jar "$@"

import path:
    @java -jar pakku.jar import "$1"