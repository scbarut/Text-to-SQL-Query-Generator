import pytest
from unittest.mock import MagicMock
from httpx import AsyncClient, ASGITransport
from api.main import app
from api.schemas import ColumnInfo, GeminiAnalysisOutput, AnalyzeRequest, AnalyzeResponse
from api.gemini_service import get_gemini_service
from api.analysis import analyze_query_result

@pytest.fixture(autouse=True)
def clean_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()

def test_heuristic_single_numeric_aggregate_stat_card():
    columns = [ColumnInfo(name="total_salary", type="INTEGER")]
    rows = [[3450000]]
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type == "stat"
    assert result.stat_value == 3450000
    assert result.stat_label == "total_salary"
    assert "total salary" in result.title.lower() or "stat" in result.title.lower()
    assert len(result.insight) > 0
    assert result.data == [{"total_salary": 3450000}]

def test_heuristic_count_aggregate_stat_card():
    columns = [ColumnInfo(name="employee_count", type="INTEGER")]
    rows = [[42]]
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type == "stat"
    assert result.stat_value == 42
    assert result.stat_label == "employee_count"

def test_heuristic_categorical_and_numeric_bar_chart():
    columns = [
        ColumnInfo(name="department", type="TEXT"),
        ColumnInfo(name="headcount", type="INTEGER"),
    ]
    rows = [
        ["Engineering", 15],
        ["Product", 8],
        ["Sales", 12],
        ["Design", 5],
        ["Marketing", 7],
        ["HR", 3],
    ]
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type == "bar"
    assert result.x_key == "department"
    assert result.y_keys == ["headcount"]
    assert len(result.data) == 6
    assert result.data[0] == {"department": "Engineering", "headcount": 15}
    assert "Engineering" in result.insight  # Identifies key insight like maximum

def test_heuristic_small_categorical_distribution_pie_chart():
    columns = [
        ColumnInfo(name="status", type="TEXT"),
        ColumnInfo(name="total", type="INTEGER"),
    ]
    rows = [
        ["Completed", 10],
        ["In Progress", 15],
        ["Planning", 5],
    ]
    # Small set (<= 5) of categorical items can be pie or bar
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type in ("pie", "bar")
    assert result.x_key == "status"
    assert result.y_keys == ["total"]
    assert len(result.data) == 3

def test_heuristic_temporal_and_numeric_line_chart():
    columns = [
        ColumnInfo(name="hire_date", type="DATE"),
        ColumnInfo(name="salary", type="REAL"),
    ]
    rows = [
        ["2021-01-15", 75000.0],
        ["2021-06-01", 82000.0],
        ["2022-03-10", 91000.0],
        ["2023-08-20", 95000.0],
    ]
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type == "line"
    assert result.x_key == "hire_date"
    assert result.y_keys == ["salary"]
    assert len(result.data) == 4
    assert len(result.insight) > 0

def test_heuristic_categorical_only_returns_table():
    columns = [
        ColumnInfo(name="first_name", type="TEXT"),
        ColumnInfo(name="last_name", type="TEXT"),
        ColumnInfo(name="department", type="TEXT"),
    ]
    rows = [
        ["Alice", "Smith", "Engineering"],
        ["Bob", "Jones", "Sales"],
    ]
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type == "table"
    assert result.x_key is None
    assert result.y_keys == []
    assert "table" in result.insight.lower() or "categorical" in result.insight.lower()

def test_heuristic_empty_rows_returns_table():
    columns = [ColumnInfo(name="name", type="TEXT"), ColumnInfo(name="age", type="INTEGER")]
    rows = []
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type == "table"
    assert len(result.data) == 0

def test_heuristic_high_cardinality_categorical_numeric():
    columns = [
        ColumnInfo(name="employee_name", type="TEXT"),
        ColumnInfo(name="salary", type="REAL"),
    ]
    rows = [[f"Employee {i}", 50000 + i * 1000] for i in range(25)]
    result = analyze_query_result(columns=columns, rows=rows)
    assert result.chart_type == "bar"
    assert result.x_key == "employee_name"
    assert result.y_keys == ["salary"]

def test_llm_guided_analysis_mode():
    mock_gemini = MagicMock()
    mock_gemini.analyze_data.return_value = GeminiAnalysisOutput(
        chart_type="area",
        x_key="hire_date",
        y_keys=["salary"],
        title="Cumulative Salary Growth Over Time",
        insight="Salary shows steady upward growth after 2021."
    )

    columns = [
        ColumnInfo(name="hire_date", type="DATE"),
        ColumnInfo(name="salary", type="REAL"),
    ]
    rows = [
        ["2021-01-15", 75000.0],
        ["2022-03-10", 91000.0],
    ]

    result = analyze_query_result(
        columns=columns,
        rows=rows,
        user_request="Show this as an area chart over time",
        use_llm=True,
        gemini_service=mock_gemini,
    )

    assert result.chart_type == "area"
    assert result.x_key == "hire_date"
    assert result.y_keys == ["salary"]
    assert result.title == "Cumulative Salary Growth Over Time"
    assert result.insight == "Salary shows steady upward growth after 2021."
    mock_gemini.analyze_data.assert_called_once()

def test_llm_guided_analysis_fallback_on_error():
    mock_gemini = MagicMock()
    mock_gemini.analyze_data.side_effect = RuntimeError("Gemini quota exceeded")

    columns = [
        ColumnInfo(name="department", type="TEXT"),
        ColumnInfo(name="headcount", type="INTEGER"),
    ]
    rows = [["Engineering", 10], ["Sales", 5]]

    result = analyze_query_result(
        columns=columns,
        rows=rows,
        user_request="Draw a pie chart",
        use_llm=True,
        gemini_service=mock_gemini,
    )

    # Gracefully falls back to heuristic classification instead of crashing
    assert result.chart_type in ("bar", "pie")
    assert result.x_key == "department"
    assert result.y_keys == ["headcount"]

@pytest.mark.asyncio
async def test_post_analyze_endpoint_heuristic():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/analyze",
            json={
                "columns": [
                    {"name": "department", "type": "TEXT"},
                    {"name": "total_budget", "type": "INTEGER"},
                ],
                "rows": [
                    ["Engineering", 500000],
                    ["Marketing", 200000],
                ],
                "use_llm": False,
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["chart_type"] in ("bar", "pie")
    assert data["x_key"] == "department"
    assert data["y_keys"] == ["total_budget"]
    assert len(data["data"]) == 2
    assert "insight" in data
    assert len(data["insight"]) > 0

@pytest.mark.asyncio
async def test_post_analyze_endpoint_llm_mode():
    mock_gemini = MagicMock()
    mock_gemini.analyze_data.return_value = GeminiAnalysisOutput(
        chart_type="pie",
        x_key="department",
        y_keys=["total_budget"],
        title="Department Budget Share",
        insight="Engineering commands the majority budget share at over 70%."
    )
    app.dependency_overrides[get_gemini_service] = lambda: mock_gemini

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/analyze",
            json={
                "columns": [
                    {"name": "department", "type": "TEXT"},
                    {"name": "total_budget", "type": "INTEGER"},
                ],
                "rows": [
                    ["Engineering", 500000],
                    ["Marketing", 200000],
                ],
                "user_request": "Show department budget share as pie chart",
                "use_llm": True,
            },
        )
    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["chart_type"] == "pie"
    assert data["title"] == "Department Budget Share"
    assert data["insight"] == "Engineering commands the majority budget share at over 70%."
