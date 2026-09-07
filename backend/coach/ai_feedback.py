
import os
import logging
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from coach.prompts import COACH_SYSTEM_PROMPT

# Import config. Assuming backend is the root, we try to import from app.core.
# If running as a module, might need adjustments, but let's try standard import.
try:
    from app.core import config
except ImportError:
    # Fallback/Mock for testing if app module not found in path
    import sys
    # sys.path.append(...) # logic if needed
    pass

# We can duplicate the get_llm logic or import it. 
# Duplicating is safer for "isolation" principle.

def get_llm():
    api_key = os.getenv("GROQ_API_KEY") # Or config.GROQ_API_KEY
    if not api_key:
        # Try to get from config object if available
        try:
            api_key = config.GROQ_API_KEY
        except:
            pass
            
    if not api_key:
        raise ValueError("GROQ_API_KEY not found.")

    return ChatGroq(
        groq_api_key=api_key,
        model_name="openai/gpt-oss-20b", # Or use a model specific for code explanation
        temperature=0.7
    )

async def generate_feedback(user_code: str, error_logs: str, velocity: str = "UNKNOWN", mastery: str = "UNKNOWN") -> str:
    """
    Explains why code failed and how to improve.
    MUST NOT decide correctness.
    """
    try:
        llm = get_llm()
        
        formatted_system_prompt = COACH_SYSTEM_PROMPT.format(
            velocity=velocity,
            mastery=mastery
        )
        
        user_message_content = f"""
Code Submitted:
```python
{user_code}
```

Error Logs:
```
{error_logs}
```
"""
        messages = [
            SystemMessage(content=formatted_system_prompt),
            HumanMessage(content=user_message_content)
        ]
        
        response = await llm.ainvoke(messages)
        return response.content
        
    except Exception as e:
        logging.error(f"AI Coach failed: {e}")
        return f"AI Coach is currently unavailable. Error: {str(e)}"
