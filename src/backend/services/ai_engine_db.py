import google.generativeai as genai
import uuid
import os
import pickle
from datetime import datetime, timedelta
from config import GEMINI_API_KEY, scheduled_interviews_collection, interview_sessions_collection
from services.prompt_service import PromptService
from bson.objectid import ObjectId

genai.configure(api_key=GEMINI_API_KEY)
print("GEMINI_API_KEY:", GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

# No longer using in-memory SESSIONS - using MongoDB instead
print("Using MongoDB for session storage (multi-worker compatible)")

def create_session(config):
    print("\n" + "="*50)
    print("🎯 CREATING NEW INTERVIEW SESSION")
    print("="*50)
    print(f"Interview Config: {config}")
    
    session_id = str(uuid.uuid4())
    print(f"Generated Session ID: {session_id}")

    # Get system prompt from database
    system_prompt = PromptService.get_system_prompt(
        candidateName=config.get('candidateName'),
        role=config.get('role'),
        natureOfRole = config.get('natureOfRole'),
        educationalQualification=config.get('educationalQualification'),
        pastYearsExperience=config.get('pastYearsExperience'),
        pastYearsExperienceField=config.get('pastYearsExperienceField'),
        currentYearExperience=config.get('currentYearExperience'),
        currentYearExperienceField=config.get('currentYearExperienceField'),
        coreSkillSet=config.get('coreSkillSet'),
        typeOfCompany=config.get('typeOfCompany'),
        interviewType=config.get('interviewType'),
        duration=config.get('duration')
    )
    
    print(f"\n📋 System Prompt:\n{system_prompt}")

    chat = model.start_chat(history=[
        {"role": "user", "parts": [system_prompt]}
    ])

    print("\n💬 Initial Chat History:")
    for i, msg in enumerate(chat.history):
        print(f"  {i+1}. Role: {msg.role}")
        print(f"     Content: {msg.parts[0].text[:100]}...")

    # Get first question prompt from database
    first_question_prompt = PromptService.get_first_question_prompt()
    response = chat.send_message(first_question_prompt)

    # Update Tokens in scheduledInterviewsCollection
    print("Start Input Tokens", response.usage_metadata.total_token_count)
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(config.get("scheduledInterviewId"))},
            {"$set": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")
    
    first_question = response.text.strip()
    print(f"\n🎤 First Question Generated:\n{first_question}")

    # Store session in MongoDB instead of memory
    session_data = {
        "_id": session_id,
        "chat_history": pickle.dumps(chat.history),  # Serialize chat history
        "answers": [],
        "questions": [first_question],
        "qa_pairs": [{"question": first_question, "answer": None}],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=2)  # Auto-expire after 2 hours
    }
    
    interview_sessions_collection.insert_one(session_data)
    
    print(f"\n✅ Session stored in MongoDB with {len(chat.history)} messages in history")
    print("="*50 + "\n")

    return session_id, first_question

def next_question(session_id, answer, timeRemaining, scheduledInterviewId):
    print("\n" + "="*50)
    print("🔄 PROCESSING NEXT QUESTION")
    print("="*50)
    print(f"Session ID: {session_id}")
    print(f"Candidate Answer: {answer}")
    
    # Retrieve session from MongoDB
    session_doc = interview_sessions_collection.find_one({"_id": session_id})
    
    if not session_doc:
        print("❌ Session not found in MongoDB!")
        return "Session expired or invalid. Please restart the interview."
    
    # Deserialize chat history and recreate chat object
    chat_history = pickle.loads(session_doc["chat_history"])
    chat = model.start_chat(history=chat_history)
    
    # Update session data
    session_doc["answers"].append(answer)
    
    # Update the last Q&A pair with the answer
    if session_doc["qa_pairs"]:
        session_doc["qa_pairs"][-1]["answer"] = answer

    print(f"\n📝 Sending prompt to AI with candidate's answer...")
    
    # Get next question prompt from database
    next_question_prompt = PromptService.get_next_question_prompt(
        answer=answer,
        time_remaining=timeRemaining
    )
    
    response = chat.send_message(next_question_prompt)

    next_q = response.text.strip()
    print("Next Question Tokens", response.usage_metadata.total_token_count)
    
    # Increase Tokens count with next question tokens
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(scheduledInterviewId)},
            {"$inc": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")
    print(f"\n🎤 Next Question Generated:\n{next_q}")
    
    # Store the new question and update MongoDB
    session_doc["questions"].append(next_q)
    session_doc["qa_pairs"].append({"question": next_q, "answer": None})
    session_doc["chat_history"] = pickle.dumps(chat.history)  # Update chat history
    
    # Update session in MongoDB
    interview_sessions_collection.update_one(
        {"_id": session_id},
        {"$set": {
            "answers": session_doc["answers"],
            "questions": session_doc["questions"],
            "qa_pairs": session_doc["qa_pairs"],
            "chat_history": session_doc["chat_history"]
        }}
    )
    
    print("="*50 + "\n")
    return next_q

def finish_interview(session_id, scheduledInterviewId):
    print("\n" + "="*50)
    print("🏁 ENDING INTERVIEW SESSION")
    print("="*50)
    print(f"Session ID: {session_id}")
    
    # Retrieve session from MongoDB
    session_doc = interview_sessions_collection.find_one({"_id": session_id})
    
    if not session_doc:
        print("❌ Session not found in MongoDB!")
        return {
            "score": 0,
            "strengths": ["No valid session found"],
            "improvements": ["Please restart the interview"],
            "error": "Session not found",
            "qa_pairs": [],
            "raw_result": None
        }
    
    # Deserialize chat history and recreate chat object
    chat_history = pickle.loads(session_doc["chat_history"])
    chat = model.start_chat(history=chat_history)
    
    violation_count = len(session_doc.get("violations", []) or [])

    # Get summary prompt from database
    summary_prompt = PromptService.get_summary_prompt(violation_count=violation_count)
    
    print(f"\n Sending Summary Prompt to AI:\n{summary_prompt}")
    response = chat.send_message(summary_prompt)
    result = response.text

    # Increase Tokens count with summary tokens
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(scheduledInterviewId)},
            {"$inc": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")

    print("Summary Tokens", response.usage_metadata.total_token_count)
    print(f"\n AI Evaluation Result:\n{result}")

    # Try to parse JSON, fallback to default if parsing fails
    import json
    try:
        print("JSON Result:", result)
        
        # Strip markdown code block markers if present
        cleaned_result = result.strip()
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:]  # Remove ```json
        elif cleaned_result.startswith("```"):
            cleaned_result = cleaned_result[3:]  # Remove ```
        
        if cleaned_result.endswith("```"):
            cleaned_result = cleaned_result[:-3]  # Remove trailing ```
        
        cleaned_result = cleaned_result.strip()
        print("Cleaned JSON:", cleaned_result)
        
        evaluation = json.loads(cleaned_result)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
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
            "improvement_guide": "Good",
            "interview_verdict": "Average"
        }
    
    # Add Q&A pairs to the evaluation
    evaluation["qa_pairs"] = session_doc["qa_pairs"]
    evaluation["raw_result"] = result
    
    # Delete session from MongoDB after completion
    interview_sessions_collection.delete_one({"_id": session_id})
    
    print(f"\n✅ Session removed from MongoDB")
    print(f"📋 Final Evaluation: {evaluation}")
    print("="*50 + "\n")
    
    return evaluation
