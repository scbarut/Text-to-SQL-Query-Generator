import os
from typing import Optional
from google import genai
from google.genai import types
from api.config import settings
from api.schemas import GeminiQueryOutput

SYSTEM_INSTRUCTION_TEMPLATE = """You are a secure, high-precision SQL assistant.
Convert the user's natural language question into a single, valid SQLite SQL query based strictly on the provided Database Schema.

Rules:
1. Generate ONLY SELECT or WITH (Common Table Expression) queries. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, PRAGMA, or other data-modifying statements.
2. Strictly use the tables and columns defined in the Database Schema below. Do not assume or invent non-existent entities.
3. Always formulate the explanation in the EXACT same language as the user's question (e.g., if asked in Turkish, explain in Turkish; if asked in English, explain in English).
4. Return only the structured output adhering to the requested schema.

Database Schema:
{schema_ddl}
"""

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.model_name = model_name or settings.model_name
        self.api_key = api_key or settings.google_api_key or os.environ.get("GOOGLE_API_KEY")
        self._client: Optional[genai.Client] = None

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not self.api_key:
                raise ValueError("GOOGLE_API_KEY is not set in environment or configuration.")
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def generate_query(self, question: str, schema_ddl: str) -> GeminiQueryOutput:
        system_instruction = SYSTEM_INSTRUCTION_TEMPLATE.format(schema_ddl=schema_ddl)

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=GeminiQueryOutput,
            temperature=0.0,
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=question,
            config=config,
        )

        if not response.text:
            raise ValueError("Empty response received from Gemini model.")
        return GeminiQueryOutput.model_validate_json(response.text)

_gemini_service_instance: Optional[GeminiService] = None

def get_gemini_service() -> GeminiService:
    global _gemini_service_instance
    if _gemini_service_instance is None:
        _gemini_service_instance = GeminiService()
    return _gemini_service_instance
