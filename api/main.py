import logging
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.engine import Engine
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from api.config import settings
from api.schemas import QueryRequest, QueryResponse
from api.database import get_engine, get_schema_ddl, execute_query
from api.gemini_service import GeminiService, get_gemini_service
from api.security import (
    validate_and_sanitize_input,
    validate_sql,
    SecurityViolationError,
)

logger = logging.getLogger(__name__)

def _get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"

# Configure SlowAPI limiter (global limit: 30 requests per minute)
limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])

app = FastAPI(
    title="Text-to-SQL Query Generator API",
    version="2.0.0",
    description="Natural language to secure SQLite SQL query generator powered by Gemini 2.5 Flash Lite"
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    client_ip = _get_client_ip(request)
    logger.warning("Rate limit exceeded for %s: %s", client_ip, exc.detail)
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": f"Rate limit exceeded: 30 requests per minute. {exc.detail}"}
    )


@app.exception_handler(SecurityViolationError)
async def security_violation_handler(request: Request, exc: SecurityViolationError):
    client_ip = _get_client_ip(request)
    logger.warning("Security violation detected from %s: %s", client_ip, str(exc))
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": f"Security violation: {str(exc)}"}
    )


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": settings.model_name,
        "db": settings.database_url
    }


@app.post("/query", response_model=QueryResponse)
@limiter.limit("30/minute")
async def query_endpoint(
    request: Request,
    query_request: QueryRequest,
    gemini_service: GeminiService = Depends(get_gemini_service),
    engine: Engine = Depends(get_engine),
):
    try:
        # 1. Input sanitization & prompt injection guard
        sanitized_question = validate_and_sanitize_input(query_request.question)

        # 2. Discover current database schema DDL
        schema_ddl = get_schema_ddl(engine)

        # 3. Generate structured SQL and explanation via Gemini
        gemini_result = gemini_service.generate_query(sanitized_question, schema_ddl)

        # 4. Enforce AST whitelisting and block destructive / multi-statement SQL
        validate_sql(gemini_result.sql)

        # 5. Execute query on read-only database connection with automatic limit
        execution = execute_query(gemini_result.sql, engine)

        return QueryResponse(
            sql=execution.executed_sql,
            explanation=gemini_result.explanation,
            columns=execution.columns,
            rows=execution.rows,
            total_count=execution.total_count,
        )
    except SecurityViolationError:
        raise
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Query processing failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query execution failed: {str(exc)}"
        ) from exc
