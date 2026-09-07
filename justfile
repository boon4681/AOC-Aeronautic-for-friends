[windows]
set shell := ["C:/Program Files/Git/bin/sh.exe", "-cu"]
set positional-arguments := true

prism := "E:/_java/PrismLauncher-Windows-MinGW-w64-Portable-11.1.0"
instance := "AOC - Aeronautic friends-2.5-PATCH-1"
pack := "build/curseforge/" + instance + ".zip"

pakku *args:
    @java -jar pakku.jar "$@"

import path:
    @java -jar pakku.jar import "$1"

out:
    @java -jar pakku.jar export --no-server

update: out
    @"{{prism}}/prismlauncher.exe" -d "{{prism}}" -I "{{pack}}"

play:
    @"{{prism}}/prismlauncher.exe" -d "{{prism}}" -l "{{instance}}"
