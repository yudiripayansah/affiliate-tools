#!/bin/sh
# Pastikan dev server sudah mengompilasi ulang app/globals.css (watcher Turbopack kadang melewatkan perubahan).
# Pakai: sh scripts/css-fresh.sh <teks-yang-harus-ada>
F=$(ls -t .next/dev/static/chunks/*globals_css*.single.css 2>/dev/null | head -1)
for i in 1 2 3 4 5 6; do
  grep -q -- "$1" "$F" 2>/dev/null && { echo "css fresh: '$1' ada"; exit 0; }
  touch app/globals.css; sleep 3
done
echo "css STALE: '$1' tidak ada di $F"; exit 1
