import os
import sqlite3
import pytest
from sqlalchemy import create_engine, text
from api.seed_demo_data import seed_demo_database, create_demo_tables

@pytest.fixture
def temp_db_path(tmp_path):
    db_file = tmp_path / "test_demo.db"
    return str(db_file)

def test_seed_demo_database_creates_all_tables_and_rows(temp_db_path):
    conn = sqlite3.connect(temp_db_path)
    create_demo_tables(conn)
    seed_demo_database(conn)
    conn.close()

    engine = create_engine(f"sqlite:///{temp_db_path}")
    with engine.connect() as connection:
        # Check all 4 tables exist
        table_rows = connection.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        ).fetchall()
        tables = [r[0] for r in table_rows]
        assert set(tables) == {"departments", "employees", "projects", "employee_projects"}

        # Check row counts
        dept_count = connection.execute(text("SELECT COUNT(*) FROM departments")).scalar()
        emp_count = connection.execute(text("SELECT COUNT(*) FROM employees")).scalar()
        proj_count = connection.execute(text("SELECT COUNT(*) FROM projects")).scalar()
        ep_count = connection.execute(text("SELECT COUNT(*) FROM employee_projects")).scalar()

        assert dept_count == 5
        assert 30 <= emp_count <= 40
        assert 6 <= proj_count <= 12
        assert 35 <= ep_count <= 50

        total_rows = dept_count + emp_count + proj_count + ep_count
        assert 50 <= total_rows <= 100, f"Expected 50-100 total rows, got {total_rows}"

        # Check multi-table JOIN works
        join_res = connection.execute(text("""
            SELECT e.first_name, e.last_name, d.name AS dept_name, p.name AS project_name, ep.role
            FROM employees e
            JOIN departments d ON e.department_id = d.id
            JOIN employee_projects ep ON e.id = ep.employee_id
            JOIN projects p ON ep.project_id = p.id
            LIMIT 5
        """)).fetchall()
        assert len(join_res) == 5

        # Check date format validity (YYYY-MM-DD)
        dates = connection.execute(text("SELECT hire_date, date_of_birth FROM employees LIMIT 10")).fetchall()
        for hire_date, dob in dates:
            assert len(hire_date.split("-")) == 3
            assert len(dob.split("-")) == 3

