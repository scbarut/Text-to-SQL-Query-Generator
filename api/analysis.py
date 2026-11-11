import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from api.schemas import ColumnInfo, GeminiAnalysisOutput, AnalyzeResponse
from api.gemini_service import GeminiService, get_gemini_service

logger = logging.getLogger(__name__)

TEMPORAL_TYPES = {"date", "time", "datetime", "timestamp"}
NUMERIC_TYPES = {
    "int", "integer", "tinyint", "smallint", "mediumint", "bigint",
    "real", "float", "double", "decimal", "numeric", "number"
}

DATE_REGEX = re.compile(r"^\d{4}[-/]\d{1,2}([-/]\d{1,2})?(\s+\d{1,2}:\d{2}(:\d{2})?)?$")

def is_temporal_column(col: ColumnInfo, sample_values: List[Any]) -> bool:
    type_lower = col.type.lower()
    if any(t in type_lower for t in TEMPORAL_TYPES):
        return True
    
    name_lower = col.name.lower()
    temporal_words = ["date", "time", "year", "month", "day", "created", "hired", "updated", "timestamp"]
    if any(word in name_lower for word in temporal_words):
        return True

    # Check sample values
    non_null_samples = [str(v).strip() for v in sample_values if v is not None][:10]
    if non_null_samples and all(DATE_REGEX.match(v) for v in non_null_samples):
        return True

    return False

def is_numeric_column(col: ColumnInfo, sample_values: List[Any]) -> bool:
    type_lower = col.type.lower()
    if any(t in type_lower for t in NUMERIC_TYPES):
        return True

    # Check if values are all numeric
    non_null = [v for v in sample_values if v is not None]
    if non_null and all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in non_null):
        return True

    return False

def rows_to_data(columns: List[ColumnInfo], rows: List[List[Any]]) -> List[Dict[str, Any]]:
    col_names = [col.name for col in columns]
    result: List[Dict[str, Any]] = []
    for row in rows:
        item: Dict[str, Any] = {}
        for col_name, val in zip(col_names, row):
            item[col_name] = val
        result.append(item)
    return result

def generate_heuristic_insight(
    chart_type: str,
    x_key: Optional[str],
    y_keys: List[str],
    data: List[Dict[str, Any]],
    stat_label: Optional[str] = None,
    stat_value: Optional[Any] = None,
) -> str:
    if chart_type == "stat" and stat_label is not None:
        formatted_val = f"{stat_value:,}" if isinstance(stat_value, (int, float)) else str(stat_value)
        clean_label = stat_label.replace("_", " ").title()
        return f"{clean_label} is {formatted_val}."

    if not data or not y_keys:
        return "Data contains categorical records; table view is recommended."

    primary_y = y_keys[0]

    # Numeric summary
    valid_items: List[Tuple[Any, float]] = []
    for item in data:
        val = item.get(primary_y)
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            x_val = item.get(x_key) if x_key else None
            valid_items.append((x_val, float(val)))

    if not valid_items:
        return "Dataset ready for exploration."

    sorted_by_val = sorted(valid_items, key=lambda x: x[1], reverse=True)
    max_item = sorted_by_val[0]
    min_item = sorted_by_val[-1]

    clean_metric = primary_y.replace("_", " ")

    if chart_type == "line":
        first_time = valid_items[0][0]
        last_time = valid_items[-1][0]
        if max_item[0] != min_item[0]:
            return (
                f"{clean_metric.title()} peaked at {max_item[1]:,} ({max_item[0]}) "
                f"and reached a minimum of {min_item[1]:,} ({min_item[0]})."
            )
        return f"{clean_metric.title()} recorded across {len(valid_items)} data points from {first_time} to {last_time}."

    if chart_type in ("bar", "pie"):
        if len(sorted_by_val) == 1:
            return f"{max_item[0]} has a {clean_metric} of {max_item[1]:,}."
        total_sum = sum(v[1] for v in valid_items)
        max_pct = round((max_item[1] / total_sum * 100), 1) if total_sum > 0 else 0
        if max_pct > 0:
            return (
                f"{max_item[0]} leads with {max_item[1]:,} {clean_metric} ({max_pct}%), "
                f"while {min_item[0]} has the lowest ({min_item[1]:,})."
            )
        return (
            f"{max_item[0]} holds the highest {clean_metric} ({max_item[1]:,}), "
            f"followed by {sorted_by_val[1][0]} ({sorted_by_val[1][1]:,})."
        )

    return f"Displaying {len(data)} records for {clean_metric}."

def classify_data_heuristic(
    columns: List[ColumnInfo],
    rows: List[List[Any]],
) -> AnalyzeResponse:
    data = rows_to_data(columns, rows)
    row_count = len(rows)
    col_count = len(columns)

    if row_count == 0 or col_count == 0:
        return AnalyzeResponse(
            chart_type="table",
            title="Query Results",
            insight="No records found to visualize.",
            data=[],
        )

    # Gather column values
    col_values: Dict[int, List[Any]] = {i: [r[i] for r in rows if i < len(r)] for i in range(col_count)}

    temporal_indices: List[int] = []
    numeric_indices: List[int] = []
    categorical_indices: List[int] = []

    for i, col in enumerate(columns):
        vals = col_values[i]
        if is_temporal_column(col, vals):
            temporal_indices.append(i)
        elif is_numeric_column(col, vals):
            numeric_indices.append(i)
        else:
            categorical_indices.append(i)

    # 1. Single numeric aggregate (e.g. COUNT, SUM, AVG) -> Stat card
    if row_count == 1:
        if col_count == 1 and (numeric_indices or not categorical_indices):
            val = rows[0][0]
            label = columns[0].name
            insight = generate_heuristic_insight("stat", None, [], data, label, val)
            return AnalyzeResponse(
                chart_type="stat",
                title=f"{label.replace('_', ' ').title()}",
                insight=insight,
                stat_value=val,
                stat_label=label,
                data=data,
            )

    # 2. Date/time + numeric column -> Line chart
    if temporal_indices and numeric_indices:
        # Prefer numeric columns that are not IDs
        filtered_numerics = [
            i for i in numeric_indices
            if not columns[i].name.lower().endswith("id")
        ]
        chosen_numerics = filtered_numerics if filtered_numerics else numeric_indices
        x_col = columns[temporal_indices[0]].name
        y_cols = [columns[i].name for i in chosen_numerics]
        title = f"{y_cols[0].replace('_', ' ').title()} Over Time"
        insight = generate_heuristic_insight("line", x_col, y_cols, data)
        return AnalyzeResponse(
            chart_type="line",
            x_key=x_col,
            y_keys=y_cols,
            title=title,
            insight=insight,
            data=data,
        )

    # 3. Categorical + numeric column
    if categorical_indices and numeric_indices:
        filtered_numerics = [
            i for i in numeric_indices
            if not columns[i].name.lower().endswith("id")
        ]
        chosen_numerics = filtered_numerics if filtered_numerics else numeric_indices
        x_col = columns[categorical_indices[0]].name
        y_cols = [columns[i].name for i in chosen_numerics]

        # Small set (<= 5 categories) with positive values can be Pie chart
        if row_count <= 5 and all(
            (item.get(y_cols[0]) or 0) >= 0 for item in data if isinstance(item.get(y_cols[0]), (int, float))
        ):
            chart_type = "pie"
            title = f"{y_cols[0].replace('_', ' ').title()} Distribution by {x_col.replace('_', ' ').title()}"
        else:
            chart_type = "bar"
            title = f"{y_cols[0].replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"

        insight = generate_heuristic_insight(chart_type, x_col, y_cols, data)
        return AnalyzeResponse(
            chart_type=chart_type,
            x_key=x_col,
            y_keys=y_cols,
            title=title,
            insight=insight,
            data=data,
        )

    # 4. 2 or more numeric columns without categorical/temporal
    if len(numeric_indices) >= 2:
        x_col = columns[numeric_indices[0]].name
        y_cols = [columns[numeric_indices[1]].name]
        title = f"{y_cols[0].replace('_', ' ').title()} vs {x_col.replace('_', ' ').title()}"
        insight = generate_heuristic_insight("bar", x_col, y_cols, data)
        return AnalyzeResponse(
            chart_type="bar",
            x_key=x_col,
            y_keys=y_cols,
            title=title,
            insight=insight,
            data=data,
        )

    # 5. Categorical columns only -> Table
    return AnalyzeResponse(
        chart_type="table",
        title="Tabular Data",
        insight="Data contains only categorical attributes; table view is recommended.",
        data=data,
    )

def analyze_query_result(
    columns: List[ColumnInfo],
    rows: List[List[Any]],
    user_request: Optional[str] = None,
    use_llm: bool = False,
    gemini_service: Optional[GeminiService] = None,
) -> AnalyzeResponse:
    data = rows_to_data(columns, rows)

    # If LLM mode requested and user provided natural language request or prompt
    if use_llm and user_request:
        service = gemini_service or get_gemini_service()
        try:
            llm_result = service.analyze_data(user_request, columns, rows)
            # Validate chart_type
            chart_type = llm_result.chart_type.lower()
            if chart_type not in {"bar", "line", "pie", "area", "stat", "table"}:
                chart_type = "bar"

            # Validate keys
            col_names = {col.name for col in columns}
            x_key = llm_result.x_key if llm_result.x_key in col_names else None
            y_keys = [k for k in llm_result.y_keys if k in col_names]

            title = llm_result.title or f"{chart_type.title()} Visualization"
            insight = llm_result.insight or generate_heuristic_insight(chart_type, x_key, y_keys, data)

            stat_value = None
            stat_label = None
            if chart_type == "stat":
                stat_value = rows[0][0] if rows and rows[0] else None
                stat_label = x_key or (columns[0].name if columns else None)

            return AnalyzeResponse(
                chart_type=chart_type,
                x_key=x_key,
                y_keys=y_keys,
                title=title,
                insight=insight,
                stat_value=stat_value,
                stat_label=stat_label,
                data=data,
            )
        except Exception as exc:
            logger.warning("LLM-guided analysis failed; falling back to heuristic: %s", exc)

    # Heuristic fallback
    return classify_data_heuristic(columns, rows)
