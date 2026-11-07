from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.engine import Engine
from api.config import settings
from api.schemas import QueryRequest, QueryResponse
from api.database import get_engine, get_schema_ddl, execute_query
from api.gemini_service import GeminiService, get_gemini_service

app = FastAPI(
    title="Text-to-SQL Query Generator API",
    version="2.0.0",
    description="Natural language to secure SQLite SQL query generator powered by Gemini 2.5 Flash Lite"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": settings.model_name,
        "db": settings.database_url
    }

@app.post("/query", response_model=QueryResponse)
async def query_endpoint(
    request: QueryRequest,
    gemini_service: GeminiService = Depends(get_gemini_service),
    engine: Engine = Depends(get_engine),
):
    try:
        # 1. Discover current database schema DDL
        schema_ddl = get_schema_ddl(engine)

        # 2. Generate structured SQL and explanation via Gemini
        gemini_result = gemini_service.generate_query(request.question, schema_ddl)

        # 3. Execute query on read-only database connection with automatic limit
        execution = execute_query(gemini_result.sql, engine)

        return QueryResponse(
            sql=execution.executed_sql,
            explanation=gemini_result.explanation,
            columns=execution.columns,
            rows=execution.rows,
            total_count=execution.total_count,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query execution failed: {str(exc)}"
        ) from exc
