# 04: Hybrid Analysis and Visualizations

**What to build:** An analytical engine and interactive charting interface that automatically visualizes query results. The system combines instant heuristic chart mapping with LLM-powered natural language visualization commands, allowing users to toggle between tables and charts, read analytical insights, and export their data.

**Blocked by:** 03: Dynamic Schema and Demo Database

**Status:** resolved

- [x] `POST /analyze` backend endpoint implemented supporting both heuristic (instant) and LLM-guided analysis modes.
- [x] Deterministic heuristic classifier maps query result shapes to appropriate chart configurations (Bar, Line, Pie, Stat card) with zero extra LLM latency.
- [x] Natural language visualization requests sent to Gemini structured outputs to generate custom Recharts configuration and a concise Insight summary.
- [x] Frontend incorporates Recharts to render Bar, Line, Pie, and Area charts with responsive formatting.
- [x] View toggle switch between raw tabular data and interactive chart representation.
- [x] Insight summary displayed alongside the visualization explaining the primary data finding.
- [x] Client-side export buttons allow exporting data to CSV and JSON, as well as saving charts as PNG images.
- [x] Automated tests verify heuristic mapping rules across categorical, numeric, and temporal column types.

## Comments

### Implementation Notes
- **Deterministic Heuristic Classifier (`api/analysis.py`)**: Implemented `classify_data_heuristic()` and `analyze_query_result()`. Introspects column types, names, and runtime values across temporal, numeric, and categorical columns. Maps:
  - Single numeric aggregate (e.g. `COUNT`, `SUM`, `AVG`) -> Stat Card
  - Temporal column + numeric column -> Line Chart
  - Categorical column + numeric column -> Bar Chart (or Pie Chart for small cardinality <= 5)
  - Multi-numeric columns -> Bar Chart
  - Categorical-only columns -> Table
  - Formats data directly for Recharts as `List[Dict[str, Any]]` and computes key analytical insights (peaks, minimums, maximum category shares) deterministically with zero latency.
- **LLM-Guided Analysis Mode (`api/gemini_service.py`)**: Added `analyze_data()` leveraging Gemini structured output (`GeminiAnalysisOutput`) to customize chart types, axes, titles, and insights based on natural language user requests. Added graceful fallback to heuristic analysis if the Gemini service encounters errors.
- **Backend API Endpoint (`POST /analyze`)**: Added `/analyze` route with rate limiting (30 requests/min), request input sanitization, and structured Pydantic models (`AnalyzeRequest`, `AnalyzeResponse`).
- **Frontend Visualizations (`src/components/ChartView.tsx`)**: Incorporated Recharts supporting Bar, Line, Pie, Area, and Stat Card representations with tooltips, responsive sizing, and modern color palettes. Includes an Analytical Insight banner, custom natural language command bar, and PNG image export via `html-to-image`.
- **View Toggle & Export Utilities (`src/App.tsx`, `src/utils/exportUtils.ts`)**: Built fluid segmented control switching between Table View and Chart View. Implemented client-side CSV and JSON data export using the browser Blob API, and chart PNG downloads.
- **Automated Tests (`api/tests/test_analysis.py`)**: Added 12 comprehensive unit and integration tests verifying all heuristic classification paths, stat cards, insight generation, LLM mode, and endpoint contracts. All 89 tests in the test suite pass.
