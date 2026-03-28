# =============================================================================
# AI Service — LangChain Prompts
# =============================================================================
# Defines the prompt structure and desired JSON output format for problem gen.
# =============================================================================

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

# =============================================================================
# Define the Output Schema (LangChain uses this to instruct the LLM)
# =============================================================================

class TestCase(BaseModel):
    input: str = Field(description="The exact string input to be passed to stdin")
    expectedOutput: str = Field(description="The exact string expected on stdout")

class Example(TestCase):
    explanation: str = Field(description="Why the output is correct for the given input")

class ProblemFormat(BaseModel):
    title: str = Field(description="A catchy, unique title for the problem")
    description: str = Field(description="The full problem statement in Markdown format")
    difficulty: str = Field(description="EASY, MEDIUM, or HARD")
    topic: str = Field(description="The broad algorithmic category")
    constraints: list[str] = Field(description="List of constraints on inputs (e.g., '1 <= N <= 10^5')")
    examples: list[Example] = Field(description="2-3 examples with explanations for the user")
    testCases: list[TestCase] = Field(description="5-10 hidden test cases for Judge0 evaluation (including edge cases)")

# =============================================================================
# Define the Prompt Template
# =============================================================================

problem_generation_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert competitive programming problem setter (like those on LeetCode or Codeforces).
Your goal is to generate a completely novel, clear, and challenging algorithmic problem.

Follow these rules STRICTLY:
1. The problem must be about the topic: {topic}.
2. The difficulty must be exactly: {difficulty}.
3. AVOID generating problems related to these previous topics the user has done: {previous_topics}.
4. Provide a creative backstory (e.g., helping a spaceship navigate, optimizing a supply chain, etc.) instead of boring generic phrasing.
5. The output MUST be a valid JSON object adhering strictly to the provided format instructions.
6. The test cases MUST be logically flawless and cover edge cases (empty inputs, large numbers, zeroes, etc.).
7. Formatting: Do not wrap the JSON output in markdown code blocks, just return raw JSON."""),
    ("user", "Format Instructions:\n{format_instructions}\n\nPlease generate the problem now.")
])

# Reusable parser instance
json_parser = JsonOutputParser(pydantic_object=ProblemFormat)
