# =============================================================================
# AI Service — Generator (using HuggingFace InferenceClient directly)
# =============================================================================
# Bypasses LangChain's HuggingFaceEndpoint entirely to avoid task-type
# routing errors with HuggingFace's free-tier providers.
# =============================================================================

import os
import json
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

from prompts.problem_generation import ProblemFormat
from prompts.code_evaluation import CodeEvaluationOutput

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACE_API_KEY")

client = InferenceClient(
    model="Qwen/Qwen2.5-7B-Instruct",
    token=HF_TOKEN,
    timeout=120
)

# =============================================================================
# 1. Problem Generation
# =============================================================================

PROBLEM_SYSTEM_PROMPT = """You are an expert competitive programming problem setter (like those on LeetCode or Codeforces).
Your goal is to generate a completely novel, clear, and challenging algorithmic problem.

Follow these rules STRICTLY:
1. The problem must be about the topic: {topic}.
2. The difficulty must be exactly: {difficulty}.
3. AVOID generating problems related to these previous topics the user has done: {previous_topics}.
4. Provide a creative backstory instead of boring generic phrasing.
5. The output MUST be a valid JSON object. Do NOT wrap it in markdown code blocks.
6. The test cases MUST be logically flawless and cover edge cases.

You MUST return ONLY a JSON object with these exact keys:
- "title": string (a catchy, unique title)
- "description": string (full problem statement in Markdown)
- "difficulty": string (EASY, MEDIUM, or HARD)
- "topic": string (broad algorithmic category)
- "constraints": array of strings (e.g., "1 <= N <= 10^5")
- "examples": array of objects with keys "input", "expectedOutput", "explanation"
- "testCases": array of objects with keys "input", "expectedOutput" (5-10 hidden test cases including edge cases)"""

def generate_problem_with_ai(topic: str, difficulty: str, previous_topics: str = "None"):
    """Generates a competitive programming problem using HuggingFace chat API."""

    system_msg = PROBLEM_SYSTEM_PROMPT.format(
        topic=topic,
        difficulty=difficulty,
        previous_topics=previous_topics
    )

    res = client.chat_completion(
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": "Generate the problem now. Return ONLY valid JSON, no markdown."}
        ],
        max_tokens=2048,
        temperature=0.3
    )

    content = res.choices[0].message.content

    # Strip markdown code fences if the model wraps them
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()

    # Sanitize invalid escape sequences (common in LLM math/regex text)
    import re
    content = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', content)

    return json.loads(content)


# =============================================================================
# 2. Code Evaluation
# =============================================================================

EVAL_SYSTEM_PROMPT = """You are an expert Senior Software Engineer and competitive programming coach.
Your task is to review a student's source code against a given algorithm problem statement.

Analyze the code rigorously:
1. Determine the Time Complexity and Space Complexity.
2. Grade the code from 0 to 100.
3. Provide concise, expert suggestions.

You MUST return ONLY a JSON object with these exact keys:
- "score": integer (0-100)
- "timeComplexity": string (Big-O notation, e.g., "O(N)")
- "spaceComplexity": string (Big-O notation, e.g., "O(1)")
- "suggestions": array of strings (2-3 actionable improvement suggestions)
- "hints": array of strings (1-2 hints if code is wrong, empty array if correct)"""

def evaluate_code_with_ai(title: str, description: str, source_code: str):
    """Evaluates user code using HuggingFace chat API."""

    user_msg = f"""Problem Title: {title}
Problem Description: {description}

Student's Submitted Code:
```
{source_code}
```

Review the code now. Return ONLY valid JSON, no markdown."""

    res = client.chat_completion(
        messages=[
            {"role": "system", "content": EVAL_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg}
        ],
        max_tokens=1024,
        temperature=0.2
    )

    content = res.choices[0].message.content

    # Strip markdown code fences if the model wraps them
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()

    # Sanitize invalid escape sequences (common in LLM math/regex text)
    import re
    content = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', content)

    return json.loads(content)
