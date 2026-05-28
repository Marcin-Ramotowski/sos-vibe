#!/bin/sh
set -e
./node_modules/.bin/prisma migrate deploy
exec env HOSTNAME=0.0.0.0 node server.js
