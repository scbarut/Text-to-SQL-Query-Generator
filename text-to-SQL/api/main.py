from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import MetaData
from sqlalchemy.sql import text
from database import engine, SessionLocal
from models import Base, Employees
from typing import Optional, Dict, Any
from smolagents import CodeAgent, HfApiModel, DuckDuckGoSearchTool, tool
import json

# Initialize FastAPI app
app = FastAPI()

from dotenv import load_dotenv
import os
from huggingface_hub import login

# Load environment variables
load_dotenv()

# Get the token from environment variables
hf_token = os.getenv("HF_TOKEN")

# Check if the token is loaded correctly
if hf_token is None:
    raise ValueError("HF_TOKEN is not set in the environment variables.")

# Login to Hugging Face
login(hf_token)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@tool
def sql_engine(query: str) -> str:
    """
    Executes the given SQL SELECT query on the 'employees' table and returns the result as a JSON-formatted string.
    This function is designed to handle only SELECT queries for retrieving data from the 'employees' table.

    The table is named 'employees'. Its description is as follows:
    - id : Integer
    - first_name : String
    - last_name : String
    - gender : String
    - date_of_birth : String
    - email : String
    - phone : String

    Args:
        query: A valid SQL SELECT query to execute.

    Returns:
        The result of the query as a JSON-formatted string.
    """
    output = []
    with engine.connect() as con:
        rows = con.execute(text(query))
        columns = rows.keys()
        for row in rows:
            output.append(dict(zip(columns, row)))

    def my_dumps(obj):
        if isinstance(obj, dict):
            items = []
            for key, value in obj.items():
                items.append('"%s": %s' % (key, my_dumps(value)))
            return '{' + ', '.join(items) + '}'
        elif isinstance(obj, list):
            items = [my_dumps(item) for item in obj]
            return '[' + ', '.join(items) + ']'
        elif obj is None:
            return 'null'
        elif isinstance(obj, str):
            # Escape backslashes and quotes as needed
            escaped = obj.replace('\\', '\\\\').replace('"', '\\"')
            return '"' + escaped + '"'
        else:
            # For numbers and booleans
            return str(obj)

    return my_dumps(output)



@tool
def sql_tool(query: str) -> str:
    """Execute SQL queries (INSERT, UPDATE, DELETE) on the employees table including modifications.

    Args:
        query: SQL query to execute (INSERT, UPDATE, DELETE). This should be correct SQL.
    Returns:
        Success message or error details
    """
    try:
        with engine.begin() as conn:
            result = conn.execute(text(query))

            if query.lower().startswith("select"):
                rows = result.fetchall()
                return "\n".join(str(row) for row in rows) if rows else "No results found"

            return "Query executed successfully"
    except Exception as e:
        return f"Error executing query: {str(e)}"


@app.post("/convert")
async def convert_text_to_sql(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        text = data.get("text")

        # Initialize agent with tools
        agent = CodeAgent(
            tools=[sql_engine, DuckDuckGoSearchTool(), sql_tool],
            model=HfApiModel()
        )
        
        result = agent.run(text)
        return {"result": result}
    except Exception as e:
        return {"error": str(e)}

