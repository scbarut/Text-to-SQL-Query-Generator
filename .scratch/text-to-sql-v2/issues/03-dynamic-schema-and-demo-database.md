# 03: Dynamic Schema and Demo Database

**What to build:** Dynamic schema discovery for any connected SQLite database paired with a rich, multi-table relational demo dataset. Users can inspect all discovered database tables and fields in a Schema Explorer sidebar, click pre-configured example queries, and seamlessly swap databases via configuration.

**Blocked by:** 02: Security Layer and Error UX

**Status:** resolved

- [x] Dynamic schema discovery engine inspects `sqlite_master` to extract complete `CREATE TABLE` DDL representations for all database entities.
- [x] Legacy hardcoded ORM models (`models.py`) removed; all database interactions run directly on discovered schema via read-only connections.
- [x] `GET /schema` endpoint implemented to return discovered tables, columns, and foreign key definitions to the client.
- [x] `POST /refresh-schema` endpoint implemented to invalidate and refresh the in-memory schema cache.
- [x] Four-table relational demo database generated (`employees`, `departments`, `projects`, `employee_projects`) containing 50–100 realistic rows, foreign key constraints, and standard `DATE` columns.
- [x] Frontend Schema Explorer sidebar added to browse discovered tables and columns interactively.
- [x] Example query cards rendered on the home page for instant single-click execution of relational and aggregate queries.
- [x] Tests verify accurate DDL extraction from multi-table SQLite fixtures and proper system prompt injection.

## Comments

### Implementation Notes
- **Dynamic Schema Discovery Engine**: Implemented in `api/database.py` with `get_schema_metadata()` and `get_schema_ddl()`. Discovers tables and raw `CREATE TABLE` DDL directly from `sqlite_master`, inspects column types/keys via `PRAGMA table_info`, maps foreign key relationships with `PRAGMA foreign_key_list`, and counts rows.
- **Engine-Keyed In-Memory Caching**: Caches schema metadata by engine URL in `_schema_cache`, refreshed on `POST /refresh-schema` or warmed at server boot via the FastAPI `lifespan` hook in `api/main.py`.
- **4-Table Relational Demo Database**: Authored `api/seed_demo_data.py` generating 90 realistic records across 4 interconnected tables (`departments`, `employees`, `projects`, `employee_projects`) featuring foreign key constraints and standard ISO `DATE` formats. Initialized `api/sql_app.db`.
- **API Endpoints**: Added `GET /schema` and `POST /refresh-schema` in `api/main.py` utilizing strongly typed Pydantic models (`TableSchema`, `ColumnMetadata`, `ForeignKeyInfo`, `DatabaseSchemaResponse`).
- **Interactive UI Enhancements**:
  - `src/components/SchemaExplorer.tsx`: Collapsible sidebar displaying database name, connection status, table list with row count badges, column data types, PK/FK indicators, table query triggers, live filter search, and dynamic cache refresh.
  - `src/components/ExampleQueries.tsx`: 6 pre-configured relational JOIN, aggregation, filtering, and analytics query cards rendered on the home page for instant single-click execution.
- **Verification**: Added `api/tests/test_demo_db.py` and `api/tests/test_schema_discovery.py` covering multi-table SQLite fixtures, cache invalidation, in-memory engines, prompt injection, and endpoint validation (77/77 passing pytest suite, 0 mypy issues, 0 TypeScript/build errors).

