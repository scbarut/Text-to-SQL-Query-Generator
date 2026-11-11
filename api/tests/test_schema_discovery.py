import sqlite3
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from api.main import app
from api.database import (
    get_schema_ddl,
    get_schema_metadata,
    invalidate_schema_cache,
    create_read_only_engine,
)
from api.schemas import DatabaseSchemaResponse
from api.gemini_service import SYSTEM_INSTRUCTION_TEMPLATE

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def clear_cache():
    invalidate_schema_cache()
    yield
    invalidate_schema_cache()

def test_get_schema_metadata_discovers_tables_columns_fks():
    engine = create_read_only_engine()
    metadata: DatabaseSchemaResponse = get_schema_metadata(engine, force_refresh=True)

    assert metadata.database_name == "sql_app.db"
    assert len(metadata.tables) == 4

    table_map = {t.name: t for t in metadata.tables}
    assert "departments" in table_map
    assert "employees" in table_map
    assert "projects" in table_map
    assert "employee_projects" in table_map

    # Check employees columns
    emp_table = table_map["employees"]
    emp_col_map = {c.name: c for c in emp_table.columns}
    assert "id" in emp_col_map
    assert emp_col_map["id"].primary_key is True
    assert emp_col_map["first_name"].type.upper() in ["TEXT", "VARCHAR"]
    assert emp_col_map["salary"].type.upper() in ["REAL", "FLOAT", "NUMERIC"]
    assert emp_col_map["hire_date"].type.upper() in ["DATE", "TEXT"]

    # Check foreign keys
    assert len(emp_table.foreign_keys) == 1
    fk = emp_table.foreign_keys[0]
    assert fk.column == "department_id"
    assert fk.referred_table == "departments"
    assert fk.referred_column == "id"

    # Check composite primary key on employee_projects
    ep_table = table_map["employee_projects"]
    ep_pks = [c.name for c in ep_table.columns if c.primary_key]
    assert set(ep_pks) == {"employee_id", "project_id"}
    assert len(ep_table.foreign_keys) == 2

    # Check row counts
    assert emp_table.row_count == 35
    assert table_map["departments"].row_count == 5

    # Check DDL
    assert "CREATE TABLE employees" in emp_table.ddl
    assert "CREATE TABLE departments" in metadata.ddl
    assert "CREATE TABLE employee_projects" in metadata.ddl

def test_schema_caching_and_invalidation():
    engine = create_read_only_engine()
    first_call = get_schema_metadata(engine)
    second_call = get_schema_metadata(engine)
    assert first_call is second_call

    invalidate_schema_cache()
    third_call = get_schema_metadata(engine)
    assert third_call is not first_call

def test_get_schema_api_endpoint(client):
    response = client.get("/schema")
    assert response.status_code == 200
    data = response.json()
    assert "database_name" in data
    assert "tables" in data
    assert "ddl" in data
    assert len(data["tables"]) == 4

    table_names = [t["name"] for t in data["tables"]]
    assert set(table_names) == {"departments", "employees", "projects", "employee_projects"}

def test_post_refresh_schema_api_endpoint(client):
    response = client.post("/refresh-schema")
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data
    assert len(data["tables"]) == 4

def test_system_prompt_injection_includes_full_ddl():
    engine = create_read_only_engine()
    ddl = get_schema_ddl(engine)
    prompt = SYSTEM_INSTRUCTION_TEMPLATE.format(schema_ddl=ddl)

    assert "CREATE TABLE departments" in prompt
    assert "CREATE TABLE employees" in prompt
    assert "CREATE TABLE projects" in prompt
    assert "CREATE TABLE employee_projects" in prompt
    assert "Rules:" in prompt
    assert "Database Schema:" in prompt

def test_schema_discovery_on_dynamic_multitable_fixture(tmp_path):
    fixture_db = tmp_path / "custom_dynamic.db"
    conn = sqlite3.connect(str(fixture_db))
    conn.execute("CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);")
    conn.execute("""
        CREATE TABLE books (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            published_date DATE,
            price REAL,
            FOREIGN KEY (author_id) REFERENCES authors (id)
        );
    """)
    conn.execute("INSERT INTO authors VALUES (1, 'Alice Walker', 'USA'), (2, 'George Orwell', 'UK');")
    conn.execute("INSERT INTO books VALUES (101, 'The Color Purple', 1, '1982-01-01', 19.99);")
    conn.commit()
    conn.close()

    fixture_engine = create_engine(f"sqlite:///{fixture_db}")
    metadata = get_schema_metadata(fixture_engine, force_refresh=True)

    assert metadata.database_name == "custom_dynamic.db"
    assert len(metadata.tables) == 2
    table_names = [t.name for t in metadata.tables]
    assert set(table_names) == {"authors", "books"}

    books_table = next(t for t in metadata.tables if t.name == "books")
    assert books_table.row_count == 1
    assert len(books_table.foreign_keys) == 1
    assert books_table.foreign_keys[0].referred_table == "authors"
    assert books_table.foreign_keys[0].referred_column == "id"

    # Test DDL contains proper definitions
    assert "CREATE TABLE authors" in metadata.ddl
    assert "CREATE TABLE books" in metadata.ddl

def test_in_memory_engine_discovery():
    mem_engine = create_engine("sqlite://")
    with mem_engine.begin() as conn:
        conn.exec_driver_sql("CREATE TABLE test_mem (id INTEGER PRIMARY KEY, val TEXT)")
        conn.exec_driver_sql("INSERT INTO test_mem VALUES (1, 'demo')")

    metadata = get_schema_metadata(mem_engine, force_refresh=True)
    assert metadata.database_name == ":memory:"
    assert len(metadata.tables) == 1
    assert metadata.tables[0].name == "test_mem"
    assert metadata.tables[0].row_count == 1

