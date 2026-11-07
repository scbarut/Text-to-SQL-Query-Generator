# 01: Core Secure Query Pipeline

**What to build:** A working natural language query pipeline powered by Google Gemini 2.5 Flash Lite structured outputs and a read-only SQLite execution engine. Users can enter a natural language question in the interface and receive both the Generated SQL with explanation and the resulting tabular data, replacing the slow HuggingFace smolagents system.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Legacy `smolagents`, `huggingface-hub`, and `duckduckgo-search` dependencies removed from backend; `google-genai`, `pydantic-settings`, and `pytest` added.
- [x] Environment configuration structured via `pydantic-settings` to accept `GOOGLE_API_KEY`, `MODEL_NAME` (defaulting to `gemini-2.5-flash-lite`), and `DATABASE_URL`.
- [x] Gemini client initialized as an application singleton using structured outputs returning `{ "sql": string, "explanation": string }`.
- [x] SQLite database connection opened in read-only mode (`mode=ro`), preventing physical data mutation.
- [x] Automatic `LIMIT 1000` applied to executed queries if no explicit limit is present.
- [x] `POST /query` endpoint operational, returning SQL, explanation, column metadata, row records, and row counts.
- [x] Frontend query interface updated to call `POST /query` and render the results in an interactive table alongside an expandable Generated SQL preview panel.
- [x] Initial automated tests passing, verifying end-to-end question-to-SQL-to-results execution with a mock Gemini provider.

## Comments

### Implementation Notes
- Replaced HuggingFace `smolagents` stack with `google-genai` and structured JSON output using Pydantic `GeminiQueryOutput`.
- Implemented `pydantic-settings` in `api/config.py` with `GOOGLE_API_KEY`, `MODEL_NAME`, and `DATABASE_URL`.
- Enforced read-only SQLite engine via `mode=ro&uri=true`, with automatic `LIMIT 1000` injection via AST inspection with `sqlparse`.
- Exposed `POST /query` returning `{ sql, explanation, columns, rows, total_count }`.
- Updated React interface in `src/App.tsx` with collapsible Generated SQL panel (expanded by default with copy-to-clipboard functionality), interactive tabular results view with type badges and quick filtering.
- Automated tests passing in `api/tests/test_query_api.py` and `api/tests/test_database.py`.
