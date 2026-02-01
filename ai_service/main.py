import json
import re
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
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
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "LLM model not loaded"}
        )

    prompt = f"""You are an expert vulnerability analyst in a DevSecOps team. Your task is to analyze vulnerability findings and assign a new priority based on the provided details.

Given the following vulnerability details:
- Description: {vulnerability.description}
- Reported Severity: {vulnerability.severity}
- CWE (Common Weakness Enumeration): {vulnerability.cwe if vulnerability.cwe else "N/A"}

Please determine the most appropriate priority from the following categories: Critical, High, Medium, Low, Informational.
Also, provide a concise justification (1-2 sentences) for your assigned priority.

Your response MUST be a JSON object with two keys: "new_priority" and "justification". Do not include any other text or formatting outside the JSON object.

Example Output:
{{
  "new_priority": "High",
  "justification": "This vulnerability allows unauthenticated remote code execution due to improper input sanitization."
}}
"""
    
    try:
        raw_response = llm(prompt, max_tokens=150, stop=["\n\n"], echo=False)
        llm_output = raw_response['choices'][0]['text']
        print(f"Raw LLM Output:\n---\n{llm_output}\n---")
        
        # Find the start of the first JSON object
        start_index = llm_output.find('{')
        if start_index == -1:
            raise ValueError("No JSON object found in the LLM response")

        # Find the corresponding closing brace for the first JSON object
        open_braces = 1
        end_index = -1
        for i in range(start_index + 1, len(llm_output)):
            if llm_output[i] == '{':
                open_braces += 1
            elif llm_output[i] == '}':
                open_braces -= 1
                if open_braces == 0:
                    end_index = i + 1
                    break
        
        if end_index == -1:
            raise ValueError("Could not find the end of the JSON object in the LLM response")

        json_string = llm_output[start_index:end_index]
        parsed_response = json.loads(json_string)
        
        return parsed_response

    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from LLM response: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Failed to decode JSON from LLM response", "raw_output": llm_output}
        )
    except ValueError as e: # Catch ValueError specifically for "No JSON object found"
        print(f"Error parsing JSON from LLM response: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Failed to parse JSON from LLM response", "raw_output": llm_output}
        )
    except (KeyError, IndexError) as e:
        print(f"An unexpected error occurred: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "An unexpected error occurred while processing the LLM response."}
        )
