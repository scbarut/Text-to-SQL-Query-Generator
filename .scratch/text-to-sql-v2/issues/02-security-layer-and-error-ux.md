# 02: Security Layer and Error UX

**What to build:** Comprehensive defense-in-depth security controls and clear user-facing error reporting. All inputs and outputs are validated through strict limits and AST analysis, destructive queries are blocked with zero exceptions, global rate limits are enforced, and violations are presented clearly to the user without exposing internal failure traces.

**Blocked by:** 01: Core Secure Query Pipeline

**Status:** ready-for-agent

- [ ] Input validator limits user query length to at most 1,000 characters and filters out control characters and prompt injection signatures.
- [ ] SQL validator inspects AST using `sqlparse`, enforcing that statements strictly begin with `SELECT` or `WITH`.
- [ ] Destructive keywords (`DROP`, `DELETE`, `TRUNCATE`, `ALTER`, `CREATE`, `INSERT`, `UPDATE`, `REPLACE`, `GRANT`, `REVOKE`, `EXEC`, `EXECUTE`, `MERGE`, `CALL`, `ATTACH`, `DETACH`, `PRAGMA`) are strictly detected and blocked.
- [ ] Multi-statement queries (chained with semicolons) are blocked.
- [ ] Global rate limiting configured at 30 requests per minute using `slowapi`, returning HTTP 429 when exceeded.
- [ ] UI displays inline warning banners for query rejections (security violations, syntax errors) and toast notifications for transient issues (network, rate limits).
- [ ] Security test suite verifies that 100% of destructive SQL patterns, prompt injection probes, and multi-statement payloads fail with proper rejection codes.

