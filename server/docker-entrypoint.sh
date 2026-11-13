#!/bin/sh
set -e
node scripts/init-db.js
node --import tsx ./node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.js
node scripts/seed-if-empty.js
exec node src/index.js