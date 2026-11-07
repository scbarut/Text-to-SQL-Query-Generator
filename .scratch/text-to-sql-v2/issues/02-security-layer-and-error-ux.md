# 02: Security Layer and Error UX

**What to build:** Comprehensive defense-in-depth security controls and clear user-facing error reporting. All inputs and outputs are validated through strict limits and AST analysis, destructive queries are blocked with zero exceptions, global rate limits are enforced, and violations are presented clearly to the user without exposing internal failure traces.

**Blocked by:** 01: Core Secure Query Pipeline

**Status:** resolved

- [x] Input validator limits user query length to at most 1,000 characters and filters out control characters and prompt injection signatures.
- [x] SQL validator inspects AST using `sqlparse`, enforcing that statements strictly begin with `SELECT` or `WITH`.
- [x] Destructive keywords (`DROP`, `DELETE`, `TRUNCATE`, `ALTER`, `CREATE`, `INSERT`, `UPDATE`, `REPLACE`, `GRANT`, `REVOKE`, `EXEC`, `EXECUTE`, `MERGE`, `CALL`, `ATTACH`, `DETACH`, `PRAGMA`) are strictly detected and blocked.
- [x] Multi-statement queries (chained with semicolons) are blocked.
- [x] Global rate limiting configured at 30 requests per minute using `slowapi`, returning HTTP 429 when exceeded.
- [x] UI displays inline warning banners for query rejections (security violations, syntax errors) and toast notifications for transient issues (network, rate limits).
- [x] Security test suite verifies that 100% of destructive SQL patterns, prompt injection probes, and multi-statement payloads fail with proper rejection codes.

## Comments

### Implementation Notes
- Created `api/security.py` with `validate_and_sanitize_input()` (1,000 char cap, ASCII & zero-width control char filtering, and regex matching for prompt injection attack signatures per OWASP LLM Top 10) and `validate_sql()` (AST token traversal via `sqlparse` verifying `SELECT`/`WITH` statements, blocking 17 destructive keywords in top-level statements/subqueries/CTEs, and rejecting multi-statement queries).
- Integrated security validators into `POST /query` in `api/main.py` with dedicated `SecurityViolationError` exception handler returning HTTP 400 Bad Request with descriptive security details and server audit logging without leaking internal stack traces.
- Configured global rate limiting with `slowapi` (`30/minute`) and custom `RateLimitExceeded` exception handler returning HTTP 429 Too Many Requests.
- Installed `sonner` and implemented clear error UX segmentation in `src/App.tsx`:
  - Domain query rejections & security violations render an inline warning banner in the main workspace with distinct visual treatment (`ShieldAlert` badge for security violations with defense policy notice; `AlertTriangle` for query rejections).
  - Transient issues (429 rate limit exceeded, 5xx server errors, network connection drops) trigger Sonner toast notifications (`toast.error()`).
  - Added query character counter (`{question.length} / 1,000`) and `maxLength={1000}` on textarea.
- Established security test suite in `api/tests/test_security.py` and integration tests in `api/tests/test_query_api.py`, achieving 100% verification across all destructive patterns, injection probes, multi-statements, and rate limiting (69/69 passing tests).

