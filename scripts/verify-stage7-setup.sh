#!/bin/sh
# Run from repository root. This project never mounts the live database volume.
set -eu
compose() { docker compose -p connect-stage7-repro -f docker-compose.dev.yml -f docker-compose.repro.yml "$@"; }
compose config --quiet
compose up -d postgres
compose build tools
compose run --rm tools sh -ec '
  npm ci
  npm run db:generate
  npm run db:migrate
  npm run db:circles
  npm run db:seed
  npm run db:seed
  npm run test:stage2
  npm run db:validate
  npm run typecheck
  npm run lint
  npm run build
'
compose up -d --build app
printf '%s\n' 'Clean-start app: http://localhost:3001/connect' 'Stop only this temporary project using the README command; no volume removal is needed.'
