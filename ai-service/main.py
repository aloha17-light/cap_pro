# =============================================================================
# AI Service — FastAPI Application
# =============================================================================
# Microservice taking requests from the Node.js API Gateway to generate
# personalized competitive programming problems using LLMs.
# =============================================================================

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.generator import generate_problem_with_ai, evaluate_code_with_ai

app = FastAPI(
    title="AI Problem Generator & Evaluator Microservice",
    description="Layer 3 Python/LangChain service for the Adaptive CP Platform.",
    version="1.0.0"
)

# Allow our Node.js API Gateway to call this service natively
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Types
# =============================================================================

# --- Schemas ---

class GenerateRequest(BaseModel):
    topic: str
    difficulty: str
    previous_topics: list[str] = []

class EvaluateRequest(BaseModel):
    problemTitle: str
    problemDescription: str
    sourceCode: str

# =============================================================================
# Endpoints
# =============================================================================

@app.get("/health")
def health_check():
    """Health check endpoint for Docker/Kubernetes."""
    return {"status": "healthy", "service": "ai-service"}

@app.post("/generate")
def generate_problem(req: GenerateRequest):
    try:
        # Convert simple list to string for the prompt
        prev_topics_str = ", ".join(req.previous_topics) if req.previous_topics else "None"
        
        problem_json = generate_problem_with_ai(
            topic=req.topic, 
            difficulty=req.difficulty, 
            previous_topics=prev_topics_str
        )
        return {"success": True, "data": problem_json}
    
    except Exception as e:
        print(f"Error in generation: {e}")
        # Return 500 when Langchain breaks or HuggingFace is down
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate")
def evaluate_code(req: EvaluateRequest):
    try:
        evaluation_json = evaluate_code_with_ai(
            title=req.problemTitle,
            description=req.problemDescription,
            source_code=req.sourceCode
        )
        return {"success": True, "data": evaluation_json}
    except Exception as e:
        print(f"Error in evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
