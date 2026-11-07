# Text-to-SQL Query Generator v2.0 — Spec

**Status:** ready-for-agent

---

## Problem Statement

The current Text-to-SQL application exists only as a basic prototype. User natural language input is passed to an LLM without any sanitization or validation, and the resulting SQL string is executed against the database unfiltered—leaving the system vulnerable to destructive queries such as `DELETE`, `DROP TABLE`, and `ALTER`. Query results are returned only as raw tabular data with zero analytical or visualization capabilities. Furthermore, the HuggingFace `smolagents` architecture re-instantiates an agent on every single HTTP request, causing severe latency (10–30 seconds per request), while the database schema is hardcoded exclusively to an `employees` table. In short, users cannot safely query arbitrary databases using natural language, nor can they explore or visualize their data effectively.

## Solution

A robust, secure, and analytical Text-to-SQL platform:

1. **Security Layer**: The user submits a natural language Query. The Security Layer sanitizes the input, enforces length limits, and guards against prompt injection.
2. **Gemini Structured Output**: The sanitized prompt and dynamic database schema (in DDL format) are sent to Gemini 2.5 Flash Lite using structured outputs, guaranteeing a deterministic `{ "sql": "...", "explanation": "..." }` response in the user's natural language.
3. **SQL Whitelist Validation**: Generated SQL is parsed and inspected via AST analysis. Only `SELECT` and `WITH` (CTE) statements are permitted. Destructive DDL/DML keywords and multi-statement queries are strictly rejected.
4. **Read-Only Database Execution**: Verified queries are executed on a read-only SQLite database connection with an automatic `LIMIT 1000` safeguard.
5. **Hybrid Analysis & Visualization**: Results are immediately displayed in a table with a collapsible Generated SQL panel. In parallel or on demand, a hybrid Analysis engine provides automatic heuristic chart configurations (zero added LLM latency) or custom LLM-guided visualizations (Recharts), complete with an explanatory Insight sentence.
6. **Dynamic Schema Discovery**: The system automatically inspects any connected SQLite database via schema discovery, allowing seamless database swaps simply by modifying the database connection environment variable.

## User Stories

### Natural Language Query Pipeline

1. As a business analyst, I want to type a question in natural language and receive queried data, so that I can explore data without writing SQL manually.
2. As a business analyst, I want to see the Generated SQL in a collapsible preview panel (expanded by default), so that I can review, learn, and verify the query executed against the database.
3. As a business analyst, I want query results presented in an interactive, formatted table, so that I can easily read and inspect column values.
4. As a business analyst, I want query results capped at 1,000 rows with a status message showing total row count (e.g., "Displaying 1,000 of 3,480 rows"), so that large result sets do not freeze my browser.
5. As a first-time user, I want clickable example queries displayed on the home page, so that I can immediately explore sample questions without having to devise my own.
6. As a business analyst, I want clear, inline error messages when a query fails due to security rejection, unsupported keywords, or invalid SQL, so that I can rephrase my question productively.
7. As a business analyst, I want transient system errors (such as network drops, rate limits, or API outages) displayed via non-intrusive toast notifications, so that I know the issue is temporary and can be retried.
8. As a multilingual user, I want the system's Generated SQL explanation and conversational feedback to match the language I used to query, so that the experience feels natural whether I write in English or Turkish.

### Security & Integrity

9. As a systems administrator, I want all non-`SELECT` and non-`WITH` SQL queries rejected prior to execution, so that the database cannot be altered or deleted.
10. As a systems administrator, I want user input restricted to a maximum of 1,000 characters and stripped of harmful control characters, so that prompt injection surfaces are minimized.
11. As a systems administrator, I want the database connection established strictly in read-only mode, so that even in the unlikely event of a validator bypass, write operations are physically impossible.
12. As a systems administrator, I want model responses validated against a strict JSON schema and parsed through SQL AST analysis, so that malformed syntax or chained multi-statement queries (e.g., separated by semicolons) are trapped and aborted.
13. As a systems administrator, I want a global rate limit of 30 requests per minute, so that API quota exhaustion and denial-of-service attempts are mitigated.
14. As a security auditor, I want security violations and rejected queries logged with relevant diagnostic details, so that abusive patterns can be reviewed and monitored.

### Dynamic Schema Discovery

15. As a developer, I want the backend to automatically discover all tables, columns, and foreign keys from the connected SQLite database, so that I never have to maintain hardcoded schema models in application code.
16. As a developer, I want to connect a different SQLite database by simply changing the database URL configuration in the environment, so that the application adapts dynamically without code modifications.
17. As a developer, I want a dedicated schema refresh endpoint, so that newly added tables or structural changes can be picked up without restarting the server.
18. As a business analyst, I want a Schema Explorer sidebar showing available tables and column structures, so that I know which entities and fields are queryable.

### Data Analysis & Visualization

19. As a data analyst, I want automatic chart recommendations based on result column types (e.g., bar charts for category + metric, line charts for time series, stat cards for single aggregates), so that I get immediate visual insights with zero extra latency.
20. As a data analyst, I want to enter custom natural language visualization commands (e.g., "Show salary distribution by department"), so that the LLM can construct customized chart definitions when basic heuristics do not suffice.
21. As a business analyst, I want to switch fluidly between table view and chart view, so that I can examine either the visual trends or the underlying raw numbers.
22. As a business analyst, I want to download generated charts as PNG images, so that I can directly paste them into reports and presentations.
23. As a business analyst, I want to export query results directly to CSV from the frontend, so that I can open the data in spreadsheet tools like Excel.
24. As a developer, I want to export query results directly to JSON from the frontend, so that I can consume the payload in external scripts or workflows.
25. As a business analyst, I want an automated Insight text attached to visualizations summarizing key observations, so that I can understand takeaways at a glance.

### UI & UX Polish

26. As a user, I want my recent query history (up to 50 items) stored in local storage and listed in a sidebar, so that I can re-execute past queries with a single click.
27. As a user, I want a dark mode / light mode toggle, so that I can view the interface comfortably in any lighting environment.
28. As a user, I want skeleton loaders and responsive loading indicators during query execution, so that I have immediate feedback that my request is being processed.

### Deployment & Operations

29. As a portfolio reviewer, I want to launch the complete system (frontend + backend) using `docker compose up`, so that evaluation requires minimal setup time.
30. As an engineer, I want the backend and frontend to use isolated container environments (multi-stage Node build into Nginx for frontend, Python slim for backend), so that deployment follows standard production practices.
31. As an engineer, I want model selection configurable via environment variables, so that alternative Gemini models can be evaluated without touching source code.

## Implementation Decisions

### LLM Integration Architecture (ADR-0001)

- The legacy HuggingFace `smolagents` stack (`HfApiModel`, `CodeAgent`, `DuckDuckGoSearchTool`) is completely removed.
- Replaced with the official Google `google-genai` SDK using `gemini-2.5-flash-lite`.
- **Structured Output Strategy**: The model is configured to return a typed JSON schema containing `sql` (string) and `explanation` (string). Function calling is deliberately bypassed because a single-purpose Text-to-SQL pipeline requires deterministic format enforcement rather than complex multi-tool orchestration.
- The Gemini client instance is initialized once on application startup (singleton pattern) rather than recreated per request.
- The system prompt enforces language alignment (replying in the prompt's language), injects full dynamic DDL tables, and mandates `SELECT`/`WITH` query generation.

### Database Architecture & Dynamic Schema (ADR-0002)

- Traditional ORM declarative models are eliminated. Static Python ORM models conflict with dynamic schema discovery across arbitrary databases.
- Database access is handled via SQLAlchemy raw text execution on a strictly read-only SQLite URI (`sqlite3` mode `ro`).
- Schema Discovery dynamically queries `sqlite_master` to retrieve comprehensive `CREATE TABLE` DDL declarations, caching them in memory for prompt injection.
- Schema size is passed uncapped into the prompt, leveraging Gemini's extensive token context window.
- A four-table demo database (`employees`, `departments`, `projects`, `employee_projects`) is established with realistic relational sample data, foreign keys, and ISO `DATE` fields.

### Security Pipeline

- **Input Sanitization**: Rejects input exceeding 1,000 characters and filters control characters.
- **AST SQL Whitelisting**: Employs `sqlparse` to tokenize and analyze Generated SQL. Only queries with statement prefixes in `["SELECT", "WITH"]` are accepted.
- **Blacklist Keyword Guard**: Blocks dangerous keywords (`DROP`, `DELETE`, `TRUNCATE`, `ALTER`, `CREATE`, `INSERT`, `UPDATE`, `REPLACE`, `GRANT`, `REVOKE`, `EXEC`, `EXECUTE`, `MERGE`, `CALL`, `ATTACH`, `DETACH`, `PRAGMA`).
- **Multi-Statement Check**: Rejects any output containing multiple statements separated by semicolons.
- **Query Row Safeguard**: Transparently appends `LIMIT 1000` when no explicit limit is present in the query.
- **Global Rate Limiting**: Enforces a global threshold of 30 requests per minute.

### Hybrid Analysis Engine

- Two independent endpoints: `/query` and `/analyze`. The client issues `/query` first to render tabular results and then invokes `/analyze` asynchronously to render charts without perceived blocking.
- **Heuristic Engine**: When no natural language chart prompt is given, a deterministic classifier inspects column metadata and result shapes to configure Recharts components (bar, pie, line, scatter, or stat cards) with zero additional LLM latency or cost.
- **LLM Engine**: When custom visual queries are requested (`user_request`), Gemini structured output generates explicit chart options and concise Insight narratives.

### Frontend Application Structure

- Managed through React 18, Vite, TypeScript, and Tailwind CSS.
- **State & Query Management**: Implements TanStack React Query (`@tanstack/react-query`) for API querying, caching, automatic retry behavior, and deterministic loading states.
- **Client-Side Export**: CSV and JSON generation executed entirely in the browser via Blob utilities.
- **Error Segmentation**: Domain query rejections appear inline in the main workspace; transport, rate-limit, and unexpected infrastructure failures trigger Sonner toasts.
- **Visualization Library**: Recharts provides responsive, accessible charts.

### API Contract Overview

| Method | Endpoint | Request Payload | Response Structure |
|---|---|---|---|
| `POST` | `/query` | `{ "question": string }` | `{ "sql": string, "explanation": string, "columns": Column[], "rows": any[][], "total_count": number }` |
| `POST` | `/analyze` | `{ "query_result": any[][], "columns": Column[], "user_request"?: string }` | `{ "chart_type": string, "chart_config": object, "insight": string }` |
| `GET` | `/schema` | None | `{ "tables": TableSchema[] }` |
| `POST` | `/refresh-schema` | None | `{ "tables_count": number }` |
| `GET` | `/health` | None | `{ "status": "ok", "model": string, "db": string }` |
| `GET` | `/examples` | None | `{ "examples": { "text": string, "category": string }[] }` |

### Deployment & Packaging

- Backend packaged in a Python 3.11 slim Docker container running Uvicorn.
- Frontend packaged in a multi-stage Docker build: Node environment builds static assets, served via an optimized Nginx container.
- Coordinated via `docker-compose.yml`.

## Testing Decisions

### What Makes a Good Test

Tests must validate observable external behavior across distinct seams rather than probing internal implementation details. Tests should demonstrate that given a specific input through the API boundary or validator interface, the system returns the exact contractually expected result or error code. All LLM calls are mocked at the service boundary to ensure deterministic, fast, and offline test execution.

### Seams and Test Boundaries

1. **API Integration Seam (Primary)**: FastAPI endpoints tested end-to-end via `httpx.AsyncClient` with a mock Gemini provider and an in-memory SQLite fixture.
2. **Security Validator Seam (Secondary)**: Unit tests directly verifying input sanitization, 1,000-character truncation, `BLOCKED_KEYWORDS` rejection, and multi-statement attack detection.
3. **Heuristic Analysis Seam (Secondary)**: Unit tests confirming that specific column type permutations consistently map to the intended Recharts configurations.
4. **Schema Discovery Seam (Secondary)**: Unit tests confirming that SQLite catalog inspection accurately extracts full table DDL structures.

### Prior Art & Tooling

No test suite currently exists. Testing will be established using `pytest`, `pytest-asyncio`, and `httpx`.

## Out of Scope

- User authentication, multi-tenancy, and role-based access control (focused on single-user portfolio usage).
- Support for external enterprise engines (PostgreSQL, MySQL, Snowflake) in v2.
- Any DML or write operations (`INSERT`, `UPDATE`, `DELETE`).
- Real-time collaborative sessions or WebSocket subscriptions.
- Dedicated mobile native clients.
- Pre-computation token summarization for large schemas.
- Frontend E2E browser automation tests (Cypress/Playwright deferred to future milestones).

## Further Notes

- The system prompt instructs Gemini to mirror the prompt's linguistic origin, ensuring natural bilingual support for both English and Turkish queries.
- Dark mode compatibility with the existing `ThemeToggle` mechanism will be preserved across all newly introduced visual components.
- The demo dataset is curated specifically to demonstrate relational SQL capabilities (multi-table JOINs, date ranges, department aggregations) on first launch.

