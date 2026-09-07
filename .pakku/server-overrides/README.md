# Running the Server Pack

Install or extract the server pack into its own directory before starting it.

## Windows

Run:

```bat
run.bat
```

## Linux and macOS

Make the launcher executable once, then run it:

```sh
chmod +x run.sh
./run.sh
```

You can override the Java executable and memory allocation with environment variables:

```sh
JAVA_BIN=/path/to/java MIN_MEMORY=1G MAX_MEMORY=6G ./run.sh
```

Both launchers expect `minecraft_server.jar` in the same server directory and start it without the graphical console.
