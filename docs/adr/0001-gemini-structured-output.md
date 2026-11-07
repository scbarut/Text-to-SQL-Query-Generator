# Gemini 2.5 Flash Lite Structured Output — Replacing HuggingFace CodeAgent

The legacy HuggingFace `smolagents` + `CodeAgent` architecture re-instantiates an agent on every request, creating 10–30s latency, lacking configurability, and incurring unnecessary costs. We are migrating to Gemini 2.5 Flash Lite using the official Google `google-genai` SDK. Instead of function calling, we use **structured output**: the model returns JSON strictly adhering to `{ "sql": "...", "explanation": "..." }`. For a single-purpose pipeline (text → SQL), function calling introduces unnecessary complexity; structured output is deterministic, straightforward to parse, and has a lower error rate.

## Considered Options

- **HuggingFace smolagents (legacy)**: Re-creates `CodeAgent` per request, slow, costly, unconfigurable, and carries bloated dependencies like `DuckDuckGoSearchTool`.
- **Gemini + Function Calling**: Flexible, but overengineered for a single tool (SQL generation). With no multi-tool orchestration needed, additional complexity provides no added value.
- **Gemini + Structured Output (selected)**: Simple, fast, deterministic. The client is initialized once at startup, and subsequent requests execute direct API calls. Output format is guaranteed via JSON schema.
