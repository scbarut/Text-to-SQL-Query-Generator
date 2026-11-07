# 04: Hybrid Analysis and Visualizations

**What to build:** An analytical engine and interactive charting interface that automatically visualizes query results. The system combines instant heuristic chart mapping with LLM-powered natural language visualization commands, allowing users to toggle between tables and charts, read analytical insights, and export their data.

**Blocked by:** 03: Dynamic Schema and Demo Database

**Status:** ready-for-agent

- [ ] `POST /analyze` backend endpoint implemented supporting both heuristic (instant) and LLM-guided analysis modes.
- [ ] Deterministic heuristic classifier maps query result shapes to appropriate chart configurations (Bar, Line, Pie, Stat card) with zero extra LLM latency.
- [ ] Natural language visualization requests sent to Gemini structured outputs to generate custom Recharts configuration and a concise Insight summary.
- [ ] Frontend incorporates Recharts to render Bar, Line, Pie, and Area charts with responsive formatting.
- [ ] View toggle switch between raw tabular data and interactive chart representation.
- [ ] Insight summary displayed alongside the visualization explaining the primary data finding.
- [ ] Client-side export buttons allow exporting data to CSV and JSON, as well as saving charts as PNG images.
- [ ] Automated tests verify heuristic mapping rules across categorical, numeric, and temporal column types.

