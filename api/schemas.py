from typing import Any, List
from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Natural language question to query the database")

class ColumnInfo(BaseModel):
    name: str
    type: str = "TEXT"

class QueryResponse(BaseModel):
    sql: str
    explanation: str
    columns: List[ColumnInfo]
    rows: List[List[Any]]
    total_count: int

class GeminiQueryOutput(BaseModel):
    sql: str
    explanation: str

