import os
import re
from typing import Any, List, Tuple, Optional, Dict
import sqlparse
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from api.config import settings
from dataclasses import dataclass
from api.schemas import (
    ColumnInfo,
    ColumnMetadata,
    ForeignKeyInfo,
    TableSchema,
    DatabaseSchemaResponse,
)

@dataclass
class ExecutionResult:
    executed_sql: str
    columns: List[ColumnInfo]
    rows: List[List[Any]]
    total_count: int

def resolve_db_path(url: str) -> str:
    """Extracts and resolves database file path from SQLite URL."""
    if url.startswith("sqlite:///"):
        file_path = url[len("sqlite:///"):]
    elif url.startswith("sqlite://"):
        file_path = url[len("sqlite://"):]
    else:
        file_path = url

    if not os.path.isabs(file_path):
        if not os.path.exists(file_path):
            # Try locating relative to the api directory
            api_dir = os.path.dirname(os.path.abspath(__file__))
            candidate = os.path.join(api_dir, os.path.basename(file_path))
            if os.path.exists(candidate):
                file_path = candidate

    return os.path.abspath(file_path).replace("\\", "/")

def create_read_only_engine(database_url: Optional[str] = None) -> Engine:
    """Creates a read-only SQLAlchemy engine for SQLite."""
    url = database_url or settings.database_url

    if ":memory:" in url or url == "sqlite://" or "mode=memory" in url:
        return create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    resolved_path = resolve_db_path(url)
    ro_uri = f"sqlite:///file:{resolved_path}?mode=ro&uri=true"

    return create_engine(
        ro_uri,
        connect_args={"check_same_thread": False},
    )

# Engine singleton for application runtime
engine: Engine = create_read_only_engine()

def get_engine() -> Engine:
    """Dependency provider for database engine."""
    return engine

def apply_limit(sql: str, default_limit: int = 1000) -> str:
    """
    Applies automatic LIMIT to SQL query if top-level statement lacks one.
    Preserves existing LIMIT clauses.
    """
    parsed = sqlparse.parse(sql)
    if not parsed:
        return sql

    stmt = parsed[0]
    has_limit = any(
        t.ttype is sqlparse.tokens.Keyword and t.value.upper() == "LIMIT"
        for t in stmt.tokens
    )

    if not has_limit:
        clean_sql = sql.strip().rstrip(";").strip()
        return f"{clean_sql} LIMIT {default_limit}"

    return sql

_schema_cache: Dict[str, DatabaseSchemaResponse] = {}

def invalidate_schema_cache(eng: Optional[Engine] = None) -> None:
    """Invalidates the in-memory schema metadata and DDL cache for an engine or all engines."""
    global _schema_cache
    if eng is not None:
        cache_key = str(eng.url)
        _schema_cache.pop(cache_key, None)
    else:
        _schema_cache.clear()

def get_database_name(eng: Engine) -> str:
    """Extracts a human-friendly database name from the engine."""
    if eng.url.database:
        return os.path.basename(eng.url.database)
    url_str = str(eng.url)
    if ":memory:" in url_str or url_str == "sqlite://":
        return ":memory:"
    if "file:" in url_str:
        file_part = url_str.split("file:")[1].split("?")[0]
        return os.path.basename(file_part)
    return "sqlite.db"

def get_schema_metadata(
    eng: Optional[Engine] = None,
    force_refresh: bool = False
) -> DatabaseSchemaResponse:
    """
    Discovers complete schema metadata from sqlite_master and PRAGMAs.
    Returns tables, columns, foreign keys, row counts, and full DDL.
    Caches the discovered schema in memory keyed by engine URL until invalidated.
    """
    global _schema_cache
    target_engine = eng or engine
    cache_key = str(target_engine.url)

    if not force_refresh and cache_key in _schema_cache:
        return _schema_cache[cache_key]

    db_name = get_database_name(target_engine)
    tables: List[TableSchema] = []
    ddl_statements: List[str] = []

    with target_engine.connect() as conn:
        # Extract tables and their DDL from sqlite_master
        master_rows = conn.execute(
            text("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        ).fetchall()

        for name, sql in master_rows:
            if not sql:
                continue

            clean_ddl = sql.strip()
            ddl_statements.append(clean_ddl)

            # Columns via PRAGMA table_info using named mapping
            col_rows = conn.execute(text(f'PRAGMA table_info("{name}")')).mappings().fetchall()
            columns: List[ColumnMetadata] = []
            for col in col_rows:
                c_name = str(col["name"])
                c_type = str(col["type"]).upper() if col["type"] else "TEXT"
                notnull = bool(col["notnull"])
                pk = bool(col["pk"] > 0)
                columns.append(
                    ColumnMetadata(
                        name=c_name,
                        type=c_type,
                        primary_key=pk,
                        nullable=not notnull,
                    )
                )

            # Foreign keys via PRAGMA foreign_key_list using named mapping
            fk_rows = conn.execute(text(f'PRAGMA foreign_key_list("{name}")')).mappings().fetchall()
            foreign_keys: List[ForeignKeyInfo] = []
            for fk in fk_rows:
                from_col = str(fk["from"])
                ref_tbl = str(fk["table"])
                to_col = str(fk["to"])
                foreign_keys.append(
                    ForeignKeyInfo(
                        column=from_col,
                        referred_table=ref_tbl,
                        referred_column=to_col,
                    )
                )

            # Row count
            try:
                row_count = conn.execute(text(f'SELECT COUNT(*) FROM "{name}"')).scalar()
                row_count_val = int(row_count) if row_count is not None else 0
            except Exception:
                row_count_val = None

            tables.append(
                TableSchema(
                    name=name,
                    columns=columns,
                    foreign_keys=foreign_keys,
                    row_count=row_count_val,
                    ddl=clean_ddl,
                )
            )

    combined_ddl = "\n\n".join(ddl_statements)
    schema_response = DatabaseSchemaResponse(
        database_name=db_name,
        tables=tables,
        ddl=combined_ddl,
    )

    _schema_cache[cache_key] = schema_response
    return schema_response

def get_schema_ddl(
    eng: Optional[Engine] = None,
    force_refresh: bool = False
) -> str:
    """Discovers schema DDL statements from sqlite_master with in-memory caching."""
    metadata = get_schema_metadata(eng, force_refresh=force_refresh)
    return metadata.ddl

DATE_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?$")

def infer_type_from_value(value: Any) -> str:
    """Infers SQL column type name from Python value."""
    if value is None:
        return "TEXT"
    if isinstance(value, bool):
        return "BOOLEAN"
    if isinstance(value, int):
        return "INTEGER"
    if isinstance(value, float):
        return "REAL"
    if isinstance(value, str):
        if DATE_REGEX.match(value.strip()):
            return "DATE"
        return "VARCHAR"
    return "TEXT"

def serialize_cell(val: Any) -> Any:
    """Ensures value is safely JSON-serializable."""
    if val is None or isinstance(val, (int, float, str, bool)):
        return val
    return str(val)

def execute_query(
    sql: str,
    eng: Optional[Engine] = None
) -> ExecutionResult:
    """
    Executes a query against the read-only SQLite database.
    Applies automatic LIMIT 1000 if absent.
    Returns ExecutionResult(executed_sql, columns, rows, total_count).
    """
    target_engine = eng or engine
    executed_sql = apply_limit(sql, 1000)
    clean_sql = sql.strip().rstrip(";").strip()

    with target_engine.connect() as conn:
        result = conn.execute(text(executed_sql))
        raw_keys = list(result.keys())
        raw_rows = result.fetchall()

        rows: List[List[Any]] = [
            [serialize_cell(cell) for cell in row]
            for row in raw_rows
        ]

        total_count = len(rows)
        # If result reached the 1000-row limit and an automatic limit was applied,
        # count the full set to show 'Displaying 1,000 of N rows'
        if total_count == 1000 and executed_sql != sql:
            try:
                count_res = conn.execute(text(f"SELECT COUNT(*) FROM ({clean_sql})")).scalar()
                if count_res is not None:
                    total_count = int(count_res)
            except Exception:
                pass

        columns: List[ColumnInfo] = []
        for col_idx, col_name in enumerate(raw_keys):
            inferred_type = "TEXT"
            for row in rows:
                if row[col_idx] is not None:
                    inferred_type = infer_type_from_value(row[col_idx])
                    break
            columns.append(ColumnInfo(name=col_name, type=inferred_type))

        return ExecutionResult(
            executed_sql=executed_sql,
            columns=columns,
            rows=rows,
            total_count=total_count,
        )
