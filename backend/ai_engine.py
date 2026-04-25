import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY"))

TRIAGE_SYSTEM_PROMPT = """
You are an Emergency Dispatch Intelligence (EDI). Your sole purpose is to parse unstructured distress messages into structured JSON for a rescue coordination system.

Instructions:
1. Categorize: Assign exactly one category: [Medical, Fire, Logistics, Security, Infrastructure].
2. Prioritize: Assign an Urgency Score (1-5). 5 = Immediate life threat; 1 = Informational/Non-urgent.
3. Skill Tagging: Identify 1-3 specific skills required (e.g., First Aid, Heavy Lifting, Electrical, Navigation).
4. Summarize: Create a concise 10-word summary of the situation.
5. Output Format: You must ONLY return a valid JSON object. No prose. No markdown blocks.

JSON Schema:
{
  "category": string,
  "urgency": integer,
  "skills": [string],
  "summary": string,
  "sentiment": "Critical" | "Stable"
}
"""

def triage_crisis(text_input):
    # Check for placeholder key to avoid hanging on initialization
    api_key = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "PLACEHOLDER":
        print("AI Triage: Using mock data (PLACEHOLDER key detected)")
        return {
            "category": "Medical",
            "urgency": 4,
            "skills": ["First Aid", "CPR", "Emergency Medicine"],
            "summary": f"Mock Analysis for: {text_input[:30]}...",
            "sentiment": "Critical"
        }

    try:
        print(f"AI Triage: Processing signal: {text_input[:50]}...")
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        print("AI Triage: Calling Gemini API...")
        response = model.generate_content(
            f"{TRIAGE_SYSTEM_PROMPT}\n\nUser Message: {text_input}"
        )
        print("AI Triage: Gemini response received.")
        
        # Extract text and clean it
        text_output = response.text.strip()
        print(f"AI Triage: Cleaning output: {text_output[:100]}...")
        
        # Handle cases where AI might include markdown code blocks
        if "```json" in text_output:
            text_output = text_output.split("```json")[1].split("```")[0].strip()
        elif "```" in text_output:
            text_output = text_output.split("```")[1].split("```")[0].strip()
            
        data = json.loads(text_output)
        
        # Validation of required fields
        required_fields = ["category", "urgency", "skills", "summary", "sentiment"]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
                
        return data
        
    except Exception as e:
        print(f"AI Triage Error: {e}")
        # Default fallback object
        return {
            "category": "Logistics",
            "urgency": 2,
            "skills": ["General Support"],
            "summary": "Fallback: Manual review required for incoming signal.",
            "sentiment": "Stable"
        }

if __name__ == "__main__":
    test_signal = "There is a massive flood near the city hospital. People are stranded on rooftops."
    result = triage_crisis(test_signal)
    print(json.dumps(result, indent=2))
