# Simple Database Restore Guide

Restore the `ctesf5` PostgreSQL database using Docker and a backup file.

### Start

docker compose up

### Restore

- Fix backup
  first, remove all `OWNER TO cf5` sentences from the backup file.

- Copying backup file into the container.
  docker cp backup.sql postgres-db:/tmp/backup.sql

- Dropping and creating the database.
  docker exec -u postgres postgres-db psql -U $DB_USER -c "DROP DATABASE IF EXISTS ctesf5;"
  docker exec -u postgres postgres-db psql -U $DB_USER -c "CREATE DATABASE ctesf5;"

- Restoring the backup.
  docker exec -u postgres postgres-db psql -U postgres -d ctesf5 -f /tmp/backup.sql

# Health check

docker exec -u postgres -it postgres-db psql -U postgres -d ctesf5

```
\dt

SELECT * FROM canchas_cancha;
```

# User

test@gmail.com
Metabasectes1
