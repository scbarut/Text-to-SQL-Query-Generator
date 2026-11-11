from typing import Any, Dict, List, Optional
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

class GeminiAnalysisOutput(BaseModel):
    chart_type: str = Field(description="Recommended chart type: 'bar', 'line', 'pie', 'area', 'stat', or 'table'")
    x_key: Optional[str] = Field(default=None, description="Column name for the X axis or category key")
    y_keys: List[str] = Field(default_factory=list, description="Column names for Y axis numeric metrics")
    title: str = Field(default="", description="Descriptive title for the chart or visual representation")
    insight: str = Field(default="", description="A concise 1-2 sentence analytical insight or trend summary of the data")

class AnalyzeRequest(BaseModel):
    columns: List[ColumnInfo] = Field(..., description="Columns returned from the SQL query")
    rows: List[List[Any]] = Field(..., description="Row data returned from the SQL query")
    user_request: Optional[str] = Field(default=None, max_length=1000, description="Optional natural language instruction for visualization")
    use_llm: bool = Field(default=False, description="Whether to invoke Gemini LLM for guided analysis")

class AnalyzeResponse(BaseModel):
    chart_type: str = Field(description="Chart type: 'bar', 'line', 'pie', 'area', 'stat', or 'table'")
    x_key: Optional[str] = Field(default=None, description="Primary category or temporal axis column name")
    y_keys: List[str] = Field(default_factory=list, description="Metric column names to plot")
    title: str = Field(description="Descriptive visualization title")
    insight: str = Field(description="Key finding or trend insight")
    stat_value: Optional[Any] = Field(default=None, description="Single metric value for stat card")
    stat_label: Optional[str] = Field(default=None, description="Label for stat card metric")
    data: List[Dict[str, Any]] = Field(default_factory=list, description="Formatted row data suitable for Recharts")


