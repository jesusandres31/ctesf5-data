#!/bin/bash

# restore.sh - Restore the ctesf5 PostgreSQL database using Docker

set -e

CONTAINER_NAME=ctesf5-db
BACKUP_FILE=backup.sql
DB_NAME=ctesf5
DB_USER=postgres
 
echo "Copying backup file into the container..."
docker cp "$BACKUP_FILE" "$CONTAINER_NAME":/tmp/backup.sql

echo "Dropping and creating the database..."
docker exec -u postgres "$CONTAINER_NAME" psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec -u postgres "$CONTAINER_NAME" psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

echo "Restoring the backup..."
docker exec -u postgres "$CONTAINER_NAME" psql -U $DB_USER -d $DB_NAME -f /tmp/backup.sql

echo "Database restore complete."
