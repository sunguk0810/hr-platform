#!/bin/bash

echo "Initializing database..."

cd "$(dirname "$0")/../docker"

# Reset database (warning: this will delete all data)
docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas < postgres/init.sql

echo "Database initialized successfully!"
