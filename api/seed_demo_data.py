import os
import sqlite3
from typing import Optional

DEPARTMENTS = [
    (1, "Engineering", "San Francisco", 1500000.0),
    (2, "Marketing", "New York", 800000.0),
    (3, "Sales", "Chicago", 1200000.0),
    (4, "Human Resources", "Austin", 400000.0),
    (5, "Finance", "London", 950000.0),
]

EMPLOYEES = [
    (1, "Alex", "Morgan", "alex.morgan@company.com", "Female", "1988-03-14", 1, 125000.0, "2019-04-01"),
    (2, "Marcus", "Chen", "marcus.chen@company.com", "Male", "1985-07-22", 1, 140000.0, "2018-02-15"),
    (3, "Sarah", "Connor", "sarah.connor@company.com", "Female", "1990-11-05", 1, 115000.0, "2020-08-10"),
    (4, "David", "Kim", "david.kim@company.com", "Male", "1992-01-30", 1, 98000.0, "2021-03-15"),
    (5, "Elena", "Rostova", "elena.rostova@company.com", "Female", "1994-06-18", 1, 92000.0, "2022-01-10"),
    (6, "James", "Wilson", "james.wilson@company.com", "Male", "1987-09-12", 1, 108000.0, "2019-11-01"),
    (7, "Priya", "Patel", "priya.patel@company.com", "Female", "1993-04-25", 1, 95000.0, "2021-09-01"),
    (8, "Lucas", "Silva", "lucas.silva@company.com", "Male", "1991-12-03", 1, 102000.0, "2020-05-18"),
    (9, "Amina", "Diallo", "amina.diallo@company.com", "Female", "1989-08-20", 2, 88000.0, "2019-06-15"),
    (10, "Oliver", "Smith", "oliver.smith@company.com", "Male", "1993-02-14", 2, 72000.0, "2021-07-20"),
    (11, "Sophia", "Garcia", "sophia.garcia@company.com", "Female", "1995-10-30", 2, 68000.0, "2022-04-12"),
    (12, "Liam", "Johnson", "liam.johnson@company.com", "Male", "1990-05-17", 2, 81000.0, "2020-02-01"),
    (13, "Emma", "Davis", "emma.davis@company.com", "Female", "1992-09-08", 2, 76000.0, "2021-11-15"),
    (14, "Noah", "Martinez", "noah.martinez@company.com", "Male", "1986-12-21", 3, 95000.0, "2018-09-01"),
    (15, "Isabella", "Brown", "isabella.brown@company.com", "Female", "1991-03-11", 3, 89000.0, "2019-10-10"),
    (16, "Ethan", "Taylor", "ethan.taylor@company.com", "Male", "1994-08-19", 3, 78000.0, "2022-02-14"),
    (17, "Mia", "Anderson", "mia.anderson@company.com", "Female", "1993-11-23", 3, 82000.0, "2021-05-01"),
    (18, "Lucas", "Thomas", "lucas.thomas@company.com", "Male", "1988-04-16", 3, 91000.0, "2020-01-20"),
    (19, "Charlotte", "Jackson", "charlotte.jackson@company.com", "Female", "1995-01-28", 3, 74000.0, "2023-01-15"),
    (20, "Benjamin", "White", "benjamin.white@company.com", "Male", "1984-10-09", 4, 92000.0, "2018-04-01"),
    (21, "Harper", "Harris", "harper.harris@company.com", "Female", "1992-06-04", 4, 71000.0, "2021-08-15"),
    (22, "Elijah", "Martin", "elijah.martin@company.com", "Male", "1996-03-27", 4, 62000.0, "2023-06-01"),
    (23, "Amelia", "Thompson", "amelia.thompson@company.com", "Female", "1990-12-15", 4, 77000.0, "2020-09-10"),
    (24, "William", "Robinson", "william.robinson@company.com", "Male", "1983-05-30", 5, 130000.0, "2018-01-10"),
    (25, "Evelyn", "Clark", "evelyn.clark@company.com", "Female", "1989-02-18", 5, 105000.0, "2019-08-20"),
    (26, "Alexander", "Rodriguez", "alexander.rodriguez@company.com", "Male", "1991-07-07", 5, 96000.0, "2020-11-01"),
    (27, "Abigail", "Lewis", "abigail.lewis@company.com", "Female", "1994-09-14", 5, 84000.0, "2022-03-15"),
    (28, "Daniel", "Lee", "daniel.lee@company.com", "Male", "1993-08-05", 1, 99000.0, "2021-10-01"),
    (29, "Chloe", "Walker", "chloe.walker@company.com", "Female", "1995-04-19", 1, 87000.0, "2022-09-15"),
    (30, "Henry", "Hall", "henry.hall@company.com", "Male", "1989-11-12", 2, 85000.0, "2020-06-01"),
    (31, "Grace", "Allen", "grace.allen@company.com", "Female", "1996-12-08", 3, 73000.0, "2023-03-01"),
    (32, "Jack", "Young", "jack.young@company.com", "Male", "1992-05-22", 3, 86000.0, "2021-04-15"),
    (33, "Ella", "King", "ella.king@company.com", "Female", "1991-10-14", 5, 98000.0, "2021-01-10"),
    (34, "Samuel", "Wright", "samuel.wright@company.com", "Male", "1987-03-03", 1, 112000.0, "2019-05-15"),
    (35, "Lily", "Scott", "lily.scott@company.com", "Female", "1994-01-25", 2, 79000.0, "2022-08-01"),
]

PROJECTS = [
    (1, "Cloud Migration", 1, "2023-01-15", "2023-11-30", "Completed"),
    (2, "AI Analytics Platform", 1, "2023-06-01", "2024-05-31", "In Progress"),
    (3, "Brand Refresh 2024", 2, "2024-01-10", "2024-08-15", "In Progress"),
    (4, "Customer Portal v2", 1, "2023-09-01", "2024-03-31", "Completed"),
    (5, "Global Sales Expansion", 3, "2023-03-01", "2024-12-31", "In Progress"),
    (6, "Employee Onboarding Portal", 4, "2023-05-01", "2023-10-31", "Completed"),
    (7, "Financial Risk Audit", 5, "2024-02-01", "2024-07-31", "In Progress"),
    (8, "Zero Trust Security Upgrade", 1, "2024-04-01", None, "Planning"),
]

EMPLOYEE_PROJECTS = [
    (1, 1, "Project Manager"),
    (2, 1, "Lead Architect"),
    (4, 1, "DevOps Engineer"),
    (8, 1, "Infrastructure Engineer"),
    (2, 2, "Technical Lead"),
    (3, 2, "AI Engineer"),
    (7, 2, "Data Engineer"),
    (28, 2, "Backend Developer"),
    (9, 3, "Marketing Lead"),
    (10, 3, "Creative Director"),
    (11, 3, "Content Strategist"),
    (12, 3, "Campaign Manager"),
    (1, 4, "Project Manager"),
    (5, 4, "Frontend Lead"),
    (6, 4, "Full Stack Engineer"),
    (29, 4, "UI/UX Developer"),
    (14, 5, "Sales Lead"),
    (15, 5, "Regional Director"),
    (16, 5, "Account Executive"),
    (17, 5, "Solutions Specialist"),
    (18, 5, "Business Development"),
    (20, 6, "HR Director"),
    (21, 6, "Program Coordinator"),
    (23, 6, "Training Specialist"),
    (24, 7, "Finance Lead"),
    (25, 7, "Senior Auditor"),
    (26, 7, "Compliance Analyst"),
    (33, 7, "Risk Specialist"),
    (3, 8, "Security Architect"),
    (6, 8, "Systems Engineer"),
    (34, 8, "Network Specialist"),
    (7, 1, "Database Administrator"),
    (8, 4, "Performance Tester"),
    (13, 3, "Digital Marketing Specialist"),
    (19, 5, "Sales Associate"),
    (22, 6, "HR Coordinator"),
    (27, 7, "Financial Analyst"),
    (30, 3, "Brand Designer"),
    (31, 5, "Sales Operations"),
    (32, 5, "Account Manager"),
    (34, 2, "Cloud Engineer"),
    (35, 3, "Copywriter"),
]

def create_demo_tables(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    cursor.execute("DROP TABLE IF EXISTS employee_projects;")
    cursor.execute("DROP TABLE IF EXISTS projects;")
    cursor.execute("DROP TABLE IF EXISTS employees;")
    cursor.execute("DROP TABLE IF EXISTS departments;")

    cursor.execute("""
    CREATE TABLE departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        budget REAL NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        gender TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        department_id INTEGER NOT NULL,
        salary REAL NOT NULL,
        hire_date DATE NOT NULL,
        FOREIGN KEY (department_id) REFERENCES departments (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        status TEXT NOT NULL,
        FOREIGN KEY (department_id) REFERENCES departments (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE employee_projects (
        employee_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        PRIMARY KEY (employee_id, project_id),
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (project_id) REFERENCES projects (id)
    );
    """)

    conn.commit()

def seed_demo_database(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    cursor.executemany(
        "INSERT INTO departments (id, name, location, budget) VALUES (?, ?, ?, ?)",
        DEPARTMENTS
    )

    cursor.executemany(
        """INSERT INTO employees
           (id, first_name, last_name, email, gender, date_of_birth, department_id, salary, hire_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        EMPLOYEES
    )

    cursor.executemany(
        """INSERT INTO projects
           (id, name, department_id, start_date, end_date, status)
           VALUES (?, ?, ?, ?, ?, ?)""",
        PROJECTS
    )

    cursor.executemany(
        """INSERT INTO employee_projects
           (employee_id, project_id, role)
           VALUES (?, ?, ?)""",
        EMPLOYEE_PROJECTS
    )

    conn.commit()

def initialize_demo_database(db_path: Optional[str] = None) -> str:
    if db_path is None:
        api_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(api_dir, "sql_app.db")

    conn = sqlite3.connect(db_path)
    try:
        create_demo_tables(conn)
        seed_demo_database(conn)
    finally:
        conn.close()

    return db_path

if __name__ == "__main__":
    path = initialize_demo_database()
    print(f"Demo database initialized successfully at: {path}")

