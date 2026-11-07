# Dynamic Schema — Without ORM Models

The system dynamically supports arbitrary SQLite database files. We do not use ORM models (`SQLAlchemy declarative models`) because static models conflict with dynamic schema discovery: writing Python classes in advance for every table undermines the goal of connecting arbitrary databases. Instead, the schema is extracted as DDL directly from `sqlite_master`, provided to the LLM in the system prompt, and queries are executed using `text()` over a read-only database connection. Since there are no write operations (only SELECT + WITH statements are permitted), the type safety and migration benefits typically provided by an ORM do not apply.

## Consequences

- When the table structure changes, Python application code does not change — calling `/refresh-schema` is sufficient.
- No compile-time type safety; invalid column names are caught at runtime via database error messages.
- Connecting a different SQLite file requires only updating the `DATABASE_URL` environment variable, with no code modifications required.
