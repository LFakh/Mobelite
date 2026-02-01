from fastapi import FastAPI
from llama_cpp import Llama

app = FastAPI()

# Initialize the LLM
try:
    llm = Llama(model_path="./feather.gguf")
except Exception as e:
    print(f"Error loading LLM model: {e}")
    llm = None

@app.get("/")
def read_root():
    return {"message": "AI Service is running", "llm_loaded": llm is not None}
