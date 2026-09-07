[windows]
set shell := ["C:/Program Files/Git/bin/sh.exe", "-cu"]
set positional-arguments := true
set dotenv-load := true

prism := env("PRISM_DIR")
instance := env("INSTANCE")
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

link: out
    set -e
    rm -rf .link_new 2>/dev/null || true
    for d in .link.*; do case "$d" in .link.new|.link.old) ;; *) rm -rf "$d" 2>/dev/null || true ;; esac; done
    mkdir -p .link_new .link
    unzip -oq "{{pack}}" -d .link_new
    mkdir -p "{{prism}}/instances/{{instance}}/minecraft"
    powershell -NoProfile -Command "robocopy '$(cygpath -w "$(pwd)/.link_new")' '$(cygpath -w "$(pwd)/.link")' /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null; exit 0"
    rm -rf .link_new 2>/dev/null || true
    for dir in datapacks kubejs shaderpacks resourcepacks; do \
        if [ -d ".link/overrides/$dir" ]; then \
            dst="{{prism}}/instances/{{instance}}/minecraft/$dir"; \
            target="$(cygpath -w "$(pwd)/.link/overrides/$dir")"; \
            dstw="$(cygpath -w "$dst")"; \
            rm -rf "$dst" && powershell -NoProfile -Command "New-Item -ItemType Junction -Path '$dstw' -Target '$target' | Out-Null"; \
        fi; \
    done