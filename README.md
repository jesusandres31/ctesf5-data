# Simple Database Restore Guide

Restore the `ctesf5` PostgreSQL database using Docker and a backup file.

### Start

docker compose up

### Restore

sh restore.sh

docker exec -u postgres ctesf5-db psql -U postgres -d ctesf5 -f /tmp/backup.sql

# Health check

docker exec -u postgres -it ctesf5-db psql -U postgres -d ctesf5

\dt

SELECT \* FROM canchas_cancha;
