# =============================================================================
# AI Service — LangChain Prompts for Code Evaluation
# =============================================================================
# Defines the prompt structure for reviewing user code against a problem statement.
# =============================================================================

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

# 1. Define the desired Pydantic output structure for strict JSON parsing
class CodeEvaluationOutput(BaseModel):
    score: int = Field(description="A quality score from 0 to 100.")
    timeComplexity: str = Field(description="Big-O notation for time complexity, e.g., O(N)")
    spaceComplexity: str = Field(description="Big-O notation for space complexity, e.g., O(1)")
    suggestions: List[str] = Field(description="2-3 specific, actionable suggestions to improve the code, optimize it, or fix bugs.")
    hints: List[str] = Field(description="If the code is heavily incorrect, 1-2 hints directing the user. If correct, leave empty.")

# 2. Build the precise conversational template
eval_system_message = """
You are an expert Senior Software Engineer and competitive programming coach.
Your task is to review a student's source code against a given algorithm problem statement.

You MUST always return the result strictly as a JSON object adhering to the provided formatting schema. Do not include markdown codeblocks or casual conversational text.

Analyze the code rigorously.
1. Determine the Time Complexity and Space Complexity natively.
2. Grade the code from 0 to 100 (where 100 is perfectly optimal and clean, 50 is functionally working but messy/unoptimized, and 0 is completely wrong).
3. Provide concise, expert suggestions.

{format_instructions}
"""

evaluation_prompt = ChatPromptTemplate.from_messages([
    ("system", eval_system_message),
    ("human", """
Problem Title: {title}
Problem Description: {description}

Student's Submitted Code:
```
{source_code}
```

Review the code now:
    """)
])
