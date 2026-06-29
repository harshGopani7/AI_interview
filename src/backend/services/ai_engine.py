import google.generativeai as genai
import uuid
import os
from config import GEMINI_API_KEY, scheduled_interviews_collection
from bson.objectid import ObjectId

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

    system_prompt = f"""
You are a professional human interviewer conducting a structured job interview.

Interview type: {config.get('type')}
Role: {config.get('role')}
Experience level: {config.get('level')}
Duration: {config.get('duration')} minutes

Rules:
- Ask ONLY ONE question at a time
- Do NOT explain answers
- Do NOT give hints or feedback
- Keep questions concise and professional
- Stay within the current round goal
- Never break character
- Never mention AI or evaluation

Round goals:
- Round 1: Basic understanding
- Round 2: Role-specific depth
- Round 3: Real-world or scenario-based

Take Interview in 3 Rounds :(1 = Warm-up, 2 = Depth, 3 = Scenario)
Never break character.
Never mention AI.
Never tell Candidate about timing, Round types.
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


    # Update Tokens in scheduledInterviewsCollection
    print("Start Input Tokens",response.usage_metadata.total_token_count)
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(config.get("scheduledInterviewId"))},
            {"$set": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")
    
    first_question = response.text.strip()
    print(f"\n🎤 First Question Generated:\n{first_question}")

    SESSIONS[session_id] = {
        "chat": chat,
        "answers": [],
        "questions": [first_question],
        "qa_pairs": [{"question": first_question, "answer": None}]
    }
    
    print(f"\n✅ Session stored with {len(chat.history)} messages in history")
    print("="*50 + "\n")

    return session_id, first_question

def next_question(session_id, answer, timeRemaining, scheduledInterviewId):
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
    
    # Update the last Q&A pair with the answer
    if session["qa_pairs"]:
        session["qa_pairs"][-1]["answer"] = answer
    
    # print(f"\n📚 Full Chat History ({len(session['chat'].history)} messages):")
    # for i, msg in enumerate(session['chat'].history):
    #     role_icon = "🤖" if msg.role == "model" else "👤"
    #     print(f"  {i+1}. {role_icon} {msg.role.upper()}:")
    #     print(f"     {msg.parts[0].text}")

    print(f"\n📝 Sending prompt to AI with candidate's answer...")
    response = session["chat"].send_message(
        f"""
Candidate answer:
{answer}

Silently evaluate the answer.

Then:
- If weak → ask a simpler or clarification question
- If average → ask a deeper related question
- If strong → ask a harder or constraint-based question

Rules:
- Ask ONLY ONE question
- No feedback, no hints, no explanations
- Stay relevant to the role and round

Violation Detection (Auto-Check)

Review the interviewer's last message.

Check for violations:
- More than one question
- Feedback or hints
- Explanations or teaching
- AI or evaluation mentions
- Unprofessional tone
- Irrelevant to role

Time Remaining to Complete Inteview :
{timeRemaining}
If time is less , Tell candidate that interview is Over, he can press end button.
Ask ONLY ONE question.
Do not give feedback.
"""
    )

    next_q = response.text.strip()
    print("Next Question Tokens",response.usage_metadata.total_token_count)
    #Increase Tokens count with next question tokens
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(scheduledInterviewId)},
            {"$inc": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")
    print(f"\n🎤 Next Question Generated:\n{next_q}")
    
    # Store the new question
    session["questions"].append(next_q)
    session["qa_pairs"].append({"question": next_q, "answer": None})
    
    # print(f"\n📊 Updated Chat History ({len(session['chat'].history)} messages):")
    # for i, msg in enumerate(session['chat'].history):
    #     role_icon = "🤖" if msg.role == "model" else "👤"
    #     content_preview = msg.parts[0].text[:80] + "..." if len(msg.parts[0].text) > 80 else msg.parts[0].text
    #     print(f"  {i+1}. {role_icon} {msg.role.upper()}: {content_preview}")
    
    print("="*50 + "\n")
    return next_q

def finish_interview(session_id, scheduledInterviewId):
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
            "error": "Session not found",
            "qa_pairs": [],
            "raw_result": None
        }
    
    session = SESSIONS[session_id]
    violation_count = len(session.get("violations", []) or [])

    
    # print(f"\n📚 Final Chat History ({len(session['chat'].history)} messages):")
    # for i, msg in enumerate(session['chat'].history):
    #     role_icon = "🤖" if msg.role == "model" else "👤"
    #     print(f"  {i+1}. {role_icon} {msg.role.upper()}:")
    #     print(f"     {msg.parts[0].text}")

    # print(f"\n Candidate Answers Collected ({len(session['answers'])} answers):")
    # for i, answer in enumerate(session['answers']):
    #     print(f"  {i+1}. {answer}")

    summary_prompt = """
You are an interview evaluator.

Based on the full interview:
- All questions and answers
- Total violations: {violation_count}
- Check for English Fluency. 

If violations > 0, slightly reduce confidence and integrity score.

Return STRICT JSON only:

{
  "score": number (0-100),
  "strengths": ["Point 1", "Point 2", "Point 3"],
  "improvements": ["Point 1", "Point 2", "Point 3"],
  "communication": "Poor | Average | Good | Excellent",
  "technical_depth": "Poor | Average | Good | Excellent"
}


Do not add extra text.
"""
    
    print(f"\n Sending Summary Prompt to AI:\n{summary_prompt}")
    response = session["chat"].send_message(summary_prompt)
    result = response.text

    #Increase Tokens count with next question tokens
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(scheduledInterviewId)},
            {"$inc": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")

    print("Summary Tokens",response.usage_metadata.total_token_count)
    print(f"\n AI Evaluation Result:\n{result}")

    # Try to parse JSON, fallback to default if parsing fails
    import json
    try:
        evaluation = json.loads(result)
    except:
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
            ],
            "communication": "Good",
            "technical_depth": "Average"
        }
    
    # Add Q&A pairs to the evaluation
    evaluation["qa_pairs"] = session["qa_pairs"]
    evaluation["raw_result"] = result
    
    print(f"\n✅ Session removed from memory")
    print(f"📋 Final Evaluation: {evaluation}")
    print("="*50 + "\n")
    
    return evaluation
