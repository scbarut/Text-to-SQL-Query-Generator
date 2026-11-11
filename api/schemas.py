from typing import Any, List, Optional
from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="Natural language question to query the database")

class ColumnInfo(BaseModel):
    name: str
    type: str = "TEXT"

class ColumnMetadata(ColumnInfo):
    primary_key: bool = False
    nullable: bool = True

class ForeignKeyInfo(BaseModel):
    column: str
    referred_table: str
    referred_column: str

class TableSchema(BaseModel):
    name: str
    columns: List[ColumnMetadata]
    foreign_keys: List[ForeignKeyInfo] = Field(default_factory=list)
    row_count: Optional[int] = None
    ddl: str

class DatabaseSchemaResponse(BaseModel):
    database_name: str
    tables: List[TableSchema]
    ddl: str

class QueryResponse(BaseModel):
    sql: str
    explanation: str
    columns: List[ColumnInfo]
    rows: List[List[Any]]
    total_count: int

class GeminiQueryOutput(BaseModel):
    sql: str
    explanation: str

