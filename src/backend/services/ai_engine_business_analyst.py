import google.generativeai as genai
import uuid
import os


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
print("GEMINI_API_KEY:", GEMINI_API_KEY)

# model = genai.GenerativeModel("gemini-2.0-flash")
model = genai.GenerativeModel("gemini-2.5-flash")


SESSIONS = {}
print("SESSIONS:", SESSIONS)

def create_session(config):
    print("\n" + "="*50)
    print("🎯 CREATING NEW INTERVIEW SESSION")
    print("="*50)
    print(f"Interview Config: {config}")
    
    session_id = str(uuid.uuid4())
    print(f"Generated Session ID: {session_id}")

#     system_prompt = f"""
# You are a professional human interviewer conducting a structured job interview.

# Interview type: {config.get('type')}
# Role: {config.get('role')}
# Experience level: {config.get('level')}

# Your behavior rules:
# - Ask ONE clear question at a time
# - Do NOT explain the answer
# - Do NOT give hints
# - Keep questions concise and professional
# - Wait for the candidate's response before continuing
# - Adjust difficulty gradually based on previous answers
# - If the answer is weak, ask a simpler or probing follow-up
# - If the answer is strong, increase difficulty slightly

# Interview structure:
# - First question: warm-up / basic understanding
# - Middle questions: role-specific depth
# - Final question: real-world or scenario-based

# Never break character.
# Never mention AI.

# """

    system_prompt = f"""
Business strategist

ROLE:
You are an AI-Powered Business Strategist acting as a senior management consultant.
Your job is to diagnose business situations, ask structured questions step by step,
apply proven business strategy frameworks, and deliver practical, actionable advice.

CORE RULES:
1. Do NOT assume information.
2. Ask ONLY ONE question at a time.
3. Proceed to the next step ONLY after the user answers.
4. Ask questions strictly based on the user’s previous selection.
5. Use professional business language.
6. Final output must be in structured notes with headings and subheadings.
7. Focus on practical execution, not theory.

STEP 1 – FUNCTION SELECTION:
Start by asking this exact question:

"Which business function do you want strategic advice on? 
Please select ONE option by number."

1. Business Diagnosis & Problem Identification
2. Market & Competitive Analysis
3. Strategic Planning & Growth Strategy
4. Financial Strategy & Profitability
5. Go-To-Market (Marketing & Sales Strategy)
6. Operations & Process Optimization
7. Risk Management & Business Continuity
8. Leadership / Board-Level Decision Support
9. Execution Roadmap & KPI Planning

Wait for the user’s selection.

STEP 2 – SUB-FUNCTION SELECTION:
Based on the selected function, ask:

"Please select the specific area you want to focus on within this function."

Offer only relevant sub-options for the chosen function.
Wait for the user’s selection.

STEP 3 – INFORMATION COLLECTION (ONE BY ONE):
Now collect required information by asking ONE question at a time.

Always begin with these mandatory questions:
1. What is your industry or type of business?
2. What is the size and stage of your business?
3. Which geography or market do you operate in?
4. What is the primary objective you want to achieve?

After that, ask function-specific questions such as:
- Current challenges
- Existing data (sales, costs, customers, etc.)
- Constraints (budget, time, compliance, manpower)
- Timeline expectations

Do NOT ask multiple questions together.
Continue until sufficient clarity is achieved.

STEP 4 – CONFIRMATION:
Summarize the user’s situation briefly and ask:

“Please confirm if my understanding is correct before I proceed.”

Proceed only after confirmation.

STEP 5 – ANALYSIS:
Internally analyze the information using appropriate business frameworks.
Do NOT show internal reasoning or chain-of-thought.
Only present conclusions.

STEP 6 – FINAL OUTPUT:
Provide a BUSINESS ADVISORY NOTE using the exact structure below:

TITLE: BUSINESS ADVISORY NOTE

1. Executive Summary
- Clear problem or opportunity statement
- High-level recommendation

2. Current Situation Analysis
- Key observations
- Root causes

3. Strategic Recommendation
- What should be done
- Why this approach is suitable

4. Practical Action Plan (Step-by-Step)
- Immediate actions (0–30 days)
- Short-term actions (30–90 days)
- Medium-term actions (3–12 months)

5. Tools, Resources & Capabilities Required
- People
- Process
- Technology

6. Risks & Mitigation
- Key risks
- How to reduce or manage them

7. Success Metrics (KPIs)
- What to measure
- Target outcomes

8. Final Strategic Advice
- What to prioritize
- What to avoid
- Leadership guidance

STEP 7 – FOLLOW-UP:
End by asking:

"Would you like this converted into an execution checklist, KPI dashboard, or automation workflow?"

IMPORTANT:
- Stay strictly within the selected function.
- Maintain a consulting-style, structured approach.
- Ensure advice is realistic and executable.
Never break character.
Never mention AI.

"""
    
    print(f"\n📋 System Prompt:\n{system_prompt}")

    chat = model.start_chat(history=[
        {"role": "user", "parts": [system_prompt]}
    ])

    print("\n💬 Initial Chat History:")
    for i, msg in enumerate(chat.history):
        print(f"  {i+1}. Role: {msg.role}")
        print(f"     Content: {msg.parts[0].text[:100]}...")

    response = chat.send_message(
        "Start the interview with a brief greeting and first question."
    )

    first_question = response.text.strip()
    print(f"\n🎤 First Question Generated:\n{first_question}")

    SESSIONS[session_id] = {
        "chat": chat,
        "answers": []
    }
    
    print(f"\n✅ Session stored with {len(chat.history)} messages in history")
    print("="*50 + "\n")

    return session_id, first_question

def next_question(session_id, answer):
    print("\n" + "="*50)
    print("🔄 PROCESSING NEXT QUESTION")
    print("="*50)
    print(f"Session ID: {session_id}")
    print(f"Candidate Answer: {answer}")
    
    if session_id not in SESSIONS:
        print("❌ Session not found!")
        return "Session expired or invalid. Please restart the interview."

    session = SESSIONS[session_id]
    session["answers"].append(answer)
    
    print(f"\n📚 Full Chat History ({len(session['chat'].history)} messages):")
    for i, msg in enumerate(session['chat'].history):
        role_icon = "🤖" if msg.role == "model" else "👤"
        print(f"  {i+1}. {role_icon} {msg.role.upper()}:")
        print(f"     {msg.parts[0].text}")

    print(f"\n📝 Sending prompt to AI with candidate's answer...")
#     response = session["chat"].send_message(
#         f"""
# Candidate answer:
# {answer}

# Evaluate the answer silently.

# Then:
# - If the answer is weak → ask a simpler or probing follow-up
# - If the answer is average → ask a related depth question
# - If the answer is strong → ask a harder question

# Ask ONLY ONE question.
# Do not give feedback.
# """

    response = session["chat"].send_message(
        f"""
Candidate answer:
{answer}

Ask ONLY ONE question.
"""
    )

    next_q = response.text.strip()
    print(f"\n🎤 Next Question Generated:\n{next_q}")
    
    print(f"\n📊 Updated Chat History ({len(session['chat'].history)} messages):")
    for i, msg in enumerate(session['chat'].history):
        role_icon = "🤖" if msg.role == "model" else "👤"
        content_preview = msg.parts[0].text[:80] + "..." if len(msg.parts[0].text) > 80 else msg.parts[0].text
        print(f"  {i+1}. {role_icon} {msg.role.upper()}: {content_preview}")
    
    print("="*50 + "\n")
    return next_q

def finish_interview(session_id):
    print("\n" + "="*50)
    print("🏁 ENDING INTERVIEW SESSION")
    print("="*50)
    print(f"Session ID: {session_id}")
    
    if session_id not in SESSIONS:
        print("❌ Session not found!")
        return {
            "score": 0,
            "strengths": ["No valid session found"],
            "improvements": ["Please restart the interview"],
            "error": "Session not found"
        }
    
    session = SESSIONS[session_id]
    violation_count = len(session.get("violations", []) or [])

    
    print(f"\n📚 Final Chat History ({len(session['chat'].history)} messages):")
    for i, msg in enumerate(session['chat'].history):
        role_icon = "🤖" if msg.role == "model" else "👤"
        print(f"  {i+1}. {role_icon} {msg.role.upper()}:")
        print(f"     {msg.parts[0].text}")

    print(f"\n Candidate Answers Collected ({len(session['answers'])} answers):")
    for i, answer in enumerate(session['answers']):
        print(f"  {i+1}. {answer}")

    summary_prompt = """
You are now an interview evaluator.

Based on the full interview:
- Questions asked
- Candidate answers

Violations observed: {violation_count}

If violations > 0:
- Slightly reduce confidence and integrity score

Provide output STRICTLY in this JSON format:

{
  "score": number (0-100),
  "strengths": [3 bullet points],
  "improvements": [3 bullet points],
  "communication": "Poor | Average | Good | Excellent",
  "technical_depth": "Poor | Average | Good | Excellent"
}

Do not add extra text.
"""
    
    print(f"\n Sending Summary Prompt to AI:\n{summary_prompt}")
    result = session["chat"].send_message(summary_prompt).text
    print(f"\n AI Evaluation Result:\n{result}")

    # Simple parsing (can improve later)
    evaluation = {
        "score": 75,
        "strengths": [
            "Good communication",
            "Relevant answers",
            "Professional tone"
        ],
        "improvements": [
            "Add real-world examples",
            "Improve structure",
            "Be more concise"
        ]
    }
    
    print(f"\n✅ Session removed from memory")
    print(f"📋 Final Evaluation: {evaluation}")
    print("="*50 + "\n")
    
    return evaluation
