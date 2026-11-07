# 03: Dynamic Schema and Demo Database

**What to build:** Dynamic schema discovery for any connected SQLite database paired with a rich, multi-table relational demo dataset. Users can inspect all discovered database tables and fields in a Schema Explorer sidebar, click pre-configured example queries, and seamlessly swap databases via configuration.

**Blocked by:** 02: Security Layer and Error UX

**Status:** ready-for-agent

- [ ] Dynamic schema discovery engine inspects `sqlite_master` to extract complete `CREATE TABLE` DDL representations for all database entities.
- [ ] Legacy hardcoded ORM models (`models.py`) removed; all database interactions run directly on discovered schema via read-only connections.
- [ ] `GET /schema` endpoint implemented to return discovered tables, columns, and foreign key definitions to the client.
- [ ] `POST /refresh-schema` endpoint implemented to invalidate and refresh the in-memory schema cache.
- [ ] Four-table relational demo database generated (`employees`, `departments`, `projects`, `employee_projects`) containing 50–100 realistic rows, foreign key constraints, and standard `DATE` columns.
- [ ] Frontend Schema Explorer sidebar added to browse discovered tables and columns interactively.
- [ ] Example query cards rendered on the home page for instant single-click execution of relational and aggregate queries.
- [ ] Tests verify accurate DDL extraction from multi-table SQLite fixtures and proper system prompt injection.

