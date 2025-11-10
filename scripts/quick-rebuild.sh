#!/bin/bash

# Quick rebuild script - skips verification
set -a
source .env
set +a

docker compose down
docker compose build --no-cache
docker compose up -d

echo "Container status:"
docker ps | grep peeak || echo "Container not running"
