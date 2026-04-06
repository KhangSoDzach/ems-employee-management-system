#!/bin/sh
set -eu

POLL_INTERVAL="${HOT_RELOAD_POLL_INTERVAL:-2}"
APP_PID=""

compute_source_hash() {
  (
    if [ -d "src/main/java" ]; then
      find src/main/java -type f | sort | while IFS= read -r file; do
        sha1sum "$file"
      done
    fi

    if [ -d "src/main/resources" ]; then
      find src/main/resources -type f | sort | while IFS= read -r file; do
        sha1sum "$file"
      done
    fi

    if [ -f "pom.xml" ]; then
      sha1sum pom.xml
    fi
  ) | sha1sum | awk '{print $1}'
}

compile_sources() {
  echo "[dev-hot-reload] Compiling sources..."
  ./mvnw -q -DskipTests compile
}

start_app() {
  echo "[dev-hot-reload] Starting Spring Boot application..."
  # Run without forking so APP_PID is the actual app process tree owner.
  ./mvnw -DskipTests -Dspring-boot.run.fork=false spring-boot:run &
  APP_PID=$!
}

stop_app() {
  if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
    echo "[dev-hot-reload] Stopping Spring Boot application..."
    # Kill child processes first (if any), then parent to avoid orphan Java processes.
    pkill -TERM -P "$APP_PID" 2>/dev/null || true
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  APP_PID=""
}

cleanup() {
  stop_app
}

trap cleanup INT TERM EXIT

compile_sources
start_app
LAST_HASH="$(compute_source_hash)"

while true; do
  sleep "$POLL_INTERVAL"

  CURRENT_HASH="$(compute_source_hash)"
  if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
    echo "[dev-hot-reload] Source change detected. Recompiling..."

    if compile_sources; then
      LAST_HASH="$CURRENT_HASH"
      stop_app
      start_app
    else
      echo "[dev-hot-reload] Compilation failed. Keeping previous app process."
    fi
  fi

  if [ -n "$APP_PID" ] && ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "[dev-hot-reload] App exited unexpectedly. Restarting..."
    start_app
  fi

done
