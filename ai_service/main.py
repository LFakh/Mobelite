from fastapi import FastAPI
from llama_cpp import Llama
from pydantic import BaseModel

app = FastAPI()

# Initialize the LLM
try:
    llm = Llama(model_path="./feather.gguf")
except Exception as e:
    print(f"Error loading LLM model: {e}")
    llm = None

class Vulnerability(BaseModel):
    description: str
    severity: str
    cwe: str | None = None

@app.get("/")
def read_root():
    return {"message": "AI Service is running", "llm_loaded": llm is not None}

@app.post("/prioritize")
def prioritize_vulnerability(vulnerability: Vulnerability):
    if not llm:
        return {"error": "LLM model not loaded"}, 500

    prompt = f"""Given the following vulnerability details, determine its priority (Critical, High, Medium, Low, Informational) and provide a concise justification.

Vulnerability Description: {vulnerability.description}
Severity (from scanner): {vulnerability.severity}
CWE (Common Weakness Enumeration): {vulnerability.cwe if vulnerability.cwe else "N/A"}

Provide your response in a JSON format with keys "new_priority" and "justification".
Example: {{'new_priority': 'High', 'justification': 'This is a critical vulnerability because...'}}
"""
    print(f"Generated LLM prompt:\n{prompt}")

    # Placeholder for actual LLM call and response parsing
    # This will be implemented in later steps (Task 2.4 and 2.5)
    return {
        "new_priority": "Medium",
        "justification": "Placeholder justification from AI service. LLM call not yet implemented."
    }