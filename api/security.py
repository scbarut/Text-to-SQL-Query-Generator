import re
import sqlparse
from sqlparse import tokens as T
from sqlparse.sql import Statement

class SecurityViolationError(Exception):
    """Raised when a security guardrail or input/SQL validation rule is violated."""
    pass


BLOCKED_KEYWORDS = frozenset({
    "DROP",
    "DELETE",
    "TRUNCATE",
    "ALTER",
    "CREATE",
    "INSERT",
    "UPDATE",
    "REPLACE",
    "GRANT",
    "REVOKE",
    "EXEC",
    "EXECUTE",
    "MERGE",
    "CALL",
    "ATTACH",
    "DETACH",
    "PRAGMA",
})

# Regular expressions for prompt injection attack detection
INJECTION_SIGNATURES: list[tuple[str, re.Pattern]] = [
    (
        "system_prompt_override",
        re.compile(
            r"(?i)\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(previous|above|prior|all|system|initial)\b.{0,30}\b(instructions?|prompts?|rules?|directives?|context)\b"
        ),
    ),
    (
        "role_play_escape",
        re.compile(
            r"(?i)\b(you\s+are\s+now|act\s+as|pretend\s+(to\s+be|you\s+are)|simulate\s+being|switch\s+to\s+mode|developer\s+mode|DAN\s+mode|jailbreak\s+mode|god\s+mode|unrestricted\s+mode)\b"
        ),
    ),
    (
        "instruction_hijack",
        re.compile(
            r"(?i)\b(do\s+not\s+follow|stop\s+following|new\s+instructions?|instead\s+(do|say|output|respond|print))\b"
        ),
    ),
    (
        "delimiter_escape",
        re.compile(
            r"(?i)(```\s*(system|assistant|user)|<\s*/?\s*(system|instruction|prompt)\s*>|\[INST\]|\[/INST\]|<<\s*SYS\s*>>|<\|im_start\|>|<\|im_end\|>)"
        ),
    ),
    (
        "data_exfiltration",
        re.compile(
            r"(?i)\b(output|reveal|show|display|print|leak|exfiltrate|extract)\b.{0,40}\b(system\s+prompt|instructions?|config|password|secret|api\s*key|token|credentials?)\b"
        ),
    ),
    (
        "context_manipulation",
        re.compile(
            r"(?i)\b(the\s+above\s+(is|was)\s+(a\s+)?(test|joke|example|fake)|end\s+of\s+(system|initial)\s+(message|prompt)|---+\s*(new|real|actual)\s+(instructions?|task))\b"
        ),
    ),
    (
        "indirect_injection_marker",
        re.compile(
            r"(?i)\b(BEGIN\s+INJECTION|INJECTED\s+INSTRUCTION|HIDDEN\s+COMMAND)\b"
        ),
    ),
]

CONTROL_CHARS_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200b\u200c\u200d\ufeff]")


def validate_and_sanitize_input(question: str) -> str:
    """
    Validates and sanitizes user natural language input.
    - Enforces maximum length of 1,000 characters.
    - Strips harmful control characters and zero-width markers.
    - Detects prompt injection signatures.
    """
    if len(question) > 1000:
        raise SecurityViolationError(
            f"Query length ({len(question)} characters) exceeds maximum allowed limit of 1000 characters."
        )

    # Strip control and invisible characters
    cleaned = CONTROL_CHARS_PATTERN.sub("", question)
    # Collapse multiple whitespace characters into single space while preserving line breaks if needed
    cleaned = re.sub(r"[ \t]+", " ", cleaned).strip()

    if not cleaned:
        raise SecurityViolationError("Query input cannot be empty.")

    # Check for prompt injection signatures
    for name, pattern in INJECTION_SIGNATURES:
        if pattern.search(cleaned):
            raise SecurityViolationError(f"Prompt injection detected: signature '{name}' matched.")

    return cleaned


def validate_sql(sql: str) -> None:
    """
    Validates generated SQL through AST analysis with sqlparse:
    - Enforces that queries strictly begin with SELECT or WITH.
    - Strictly detects and blocks destructive keywords across AST tokens.
    - Strictly blocks multi-statement queries.
    """
    if not sql or not sql.strip():
        raise SecurityViolationError("SQL query cannot be empty.")

    parsed = sqlparse.parse(sql)
    non_empty_stmts: list[Statement] = [
        s for s in parsed if str(s).strip().rstrip(";").strip()
    ]

    if not non_empty_stmts:
        raise SecurityViolationError("SQL query contains no executable statements.")

    if len(non_empty_stmts) > 1:
        raise SecurityViolationError("Multi-statement queries (chained with semicolons) are strictly prohibited.")

    stmt = non_empty_stmts[0]

    # Enforce strictly SELECT or WITH as the first token
    first_token = stmt.token_first(skip_ws=True, skip_cm=True)
    if not first_token or first_token.value.upper() not in ("SELECT", "WITH"):
        raise SecurityViolationError("Queries must strictly begin with 'SELECT' or 'WITH'.")

    # Traverse all flattened AST tokens to inspect for blocked destructive keywords
    for token in stmt.flatten():
        # Skip string literals and comments so queries searching for words like 'insert' in text are permitted
        if token.ttype in T.Literal.String or token.ttype in T.Comment:
            continue

        raw_val = token.value.strip('"`[]()').upper()
        if raw_val in BLOCKED_KEYWORDS:
            raise SecurityViolationError(f"Destructive keyword '{raw_val}' is strictly blocked.")

