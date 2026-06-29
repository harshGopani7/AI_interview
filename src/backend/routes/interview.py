import os
import shutil
import tempfile
import threading
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.ai_engine_db import (
    create_session,
    next_question,
    finish_interview
)
from services.gdrive_uploader import upload_to_drive, create_resumable_upload_url, set_file_permission_and_get_link
from config import scheduled_interviews_collection, interview_results_collection
from bson import ObjectId
from datetime import datetime

interview_bp = Blueprint("interview", __name__)

@interview_bp.route("/start-interview", methods=["POST"])
@jwt_required()
def start():
    data = request.json
    print("Data:", data)
    session_id, first_q = create_session(data)
    return jsonify({
        "session_id": session_id,
        "question": first_q
    })

@interview_bp.route("/next-question", methods=["POST"])
@jwt_required()
def next_questions():
    data = request.json

    session_id = data.get("session_id")
    answer = data.get("answer")
    timeRemaining = data.get("timeRemaining")
    scheduledInterviewId = data.get("scheduledInterviewId")

    if not session_id or not answer:
        return jsonify({"error": "Invalid request"}), 400

    q = next_question(session_id, answer, timeRemaining, scheduledInterviewId)
    return jsonify({"question": q})

# @interview_bp.route("/next-question", methods=["POST"])
# def next_q():
#     data = request.json

#     if not data.get("session_id"):
#         return jsonify({"question": "Invalid session. Restart interview."}), 400

#     q = next_question(data["session_id"], data["answer"])
#     return jsonify({ "question": q })
5

@interview_bp.route("/end-interview", methods=["POST"])
@jwt_required()
def end():
    data = request.json
    current_user = get_jwt_identity()
    
    if not data or not data.get("session_id"):
        return jsonify({"error": "Session ID required"}), 400

    scheduledInterviewId = data.get("scheduledInterviewId")
    credentialId = data.get("credentialId")
    
    feedback = finish_interview(data["session_id"], scheduledInterviewId)
    
    

    
    # Save interview results to database
    try:
        result_doc = {
            "candidateId": current_user,
            "credentialId": credentialId,
            "scheduledInterviewId": scheduledInterviewId,
            "score": feedback.get("score", 0),
            "strengths": feedback.get("strengths", []),
            "improvements": feedback.get("improvements", []),
            "interview_verdict": feedback.get("interview_verdict", "Average"),
            "improvement_guide": feedback.get("improvement_guide", "Average"),
            "qa_pairs": feedback.get("qa_pairs", []),
            "raw_result": feedback.get("raw_result", ""),
            "completed_at": datetime.utcnow(),
            "published": False
        }
        
        interview_results_collection.insert_one(result_doc)
        print(f"Interview results saved for candidate: {current_user}")
    except Exception as e:
        print(f"Error saving interview results: {e}")
    
    # Mark interview as completed
    if scheduledInterviewId:
        try:
            scheduled_interviews_collection.update_one(
                {"_id": ObjectId(scheduledInterviewId)},
                {"$set": {"completed": True, "completedAt": datetime.utcnow()}}
            )
        except Exception as e:
            print(f"Error marking interview as completed: {e}")
    
    return jsonify(feedback)


@interview_bp.route("/upload-recording", methods=["POST"])
@jwt_required()
def upload_single_recording():
    """
    Accept the recording file from the browser, save it to a temp file,
    then immediately return 202 while a background thread handles the
    Drive upload + DB update. This frees the Flask worker instantly so
    other candidates' requests are never blocked.
    """
    scheduled_interview_id = request.form.get("scheduledInterviewId")
    rec_type = request.form.get("type")  # "screen" or "camera"
    file = request.files.get("file")

    if not scheduled_interview_id or not rec_type or not file:
        return jsonify({"error": "scheduledInterviewId, type, and file are required"}), 400

    if rec_type not in ("screen", "camera"):
        return jsonify({"error": "type must be 'screen' or 'camera'"}), 400

    db_field = "screenRecordingUrl" if rec_type == "screen" else "cameraRecordingUrl"

    # Save to temp file synchronously (fast — local disk write only)
    tmp_dir = tempfile.mkdtemp()
    file_name = f"{scheduled_interview_id}_{rec_type}.webm"
    file_path = os.path.join(tmp_dir, file_name)
    file.save(file_path)
    print(f"[Recording] Saved {rec_type} to temp, starting background Drive upload...")

    def _upload_in_background(fp, fn, tmp, sid, db_f, rtype):
        try:
            link = upload_to_drive(fp, fn, "video/webm")
            scheduled_interviews_collection.update_one(
                {"_id": ObjectId(sid)},
                {"$set": {db_f: link}}
            )
            print(f"[Recording] {rtype} uploaded and saved for {sid}: {link}")
        except Exception as e:
            print(f"[Recording] Background upload error for {rtype} ({sid}): {e}")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    threading.Thread(
        target=_upload_in_background,
        args=(file_path, file_name, tmp_dir, scheduled_interview_id, db_field, rec_type),
        daemon=True,
    ).start()

    return jsonify({"message": f"{rec_type} recording accepted, uploading in background"}), 202
