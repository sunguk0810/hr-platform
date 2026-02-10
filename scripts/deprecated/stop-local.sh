#!/bin/bash

echo "Stopping HR SaaS Local Environment..."

cd "$(dirname "$0")/../docker"

docker-compose down

echo "All services stopped."
