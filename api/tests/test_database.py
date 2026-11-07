import pytest
from sqlalchemy import text
from api.database import (
    create_read_only_engine,
    apply_limit,
    get_schema_ddl,
    execute_query,
)

@pytest.fixture
def db_engine():
    return create_read_only_engine()

def test_apply_limit():
    assert apply_limit("SELECT * FROM employees") == "SELECT * FROM employees LIMIT 1000"
    assert apply_limit("SELECT * FROM employees;") == "SELECT * FROM employees LIMIT 1000"
    assert apply_limit("SELECT * FROM employees LIMIT 50") == "SELECT * FROM employees LIMIT 50"
    assert apply_limit("SELECT * FROM employees LIMIT 50;") == "SELECT * FROM employees LIMIT 50;"
    assert apply_limit("SELECT * FROM (SELECT * FROM employees LIMIT 5)") == "SELECT * FROM (SELECT * FROM employees LIMIT 5) LIMIT 1000"

def test_read_only_engine_blocks_mutation(db_engine):
    with pytest.raises(Exception) as excinfo:
        with db_engine.connect() as conn:
            conn.execute(text("INSERT INTO employees (first_name) VALUES ('Hacker')"))
    assert "readonly" in str(excinfo.value).lower()

def test_get_schema_ddl(db_engine):
    ddl = get_schema_ddl(db_engine)
    assert "CREATE TABLE employees" in ddl
    assert "first_name" in ddl
    assert "email" in ddl

def test_execute_query_returns_metadata_and_rows(db_engine):
    res = execute_query("SELECT id, first_name, email FROM employees", db_engine)

    assert res.executed_sql == "SELECT id, first_name, email FROM employees LIMIT 1000"
    assert len(res.columns) == 3
    assert [c.name for c in res.columns] == ["id", "first_name", "email"]
    assert len(res.rows) == 10
    assert res.total_count == 10
