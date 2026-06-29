import google.generativeai as genai
import os
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("GEMINI_API_KEY:", GEMINI_API_KEY)

if not GEMINI_API_KEY:
    print("❌ Error: GEMINI_API_KEY not found in environment variables!")
    print("Please make sure your .env file contains: GEMINI_API_KEY=your_key_here")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

# Initialize model
model = genai.GenerativeModel("gemini-2.5-flash")

print("🤖 Testing Gemini API with 10 requests")
print("=" * 50)

# Test question
test_question = "What is the capital of France and tell me one interesting fact about it?"

for i in range(1, 11):
    print(f"\n📝 Request {i}/10")
    print("-" * 30)
    print(f"Question: {test_question}")
    
    try:
        # Generate response
        response = model.generate_content(test_question)
        answer = response.text.strip()
        
        print(f"Answer: {answer}")
        print("✅ Success")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Small delay between requests
    if i < 10:
        time.sleep(1)

print("\n" + "=" * 50)
print("🎯 Test completed!")
