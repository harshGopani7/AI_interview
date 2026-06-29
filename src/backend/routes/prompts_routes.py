from flask import Blueprint, request, jsonify
from config import prompts_collection
from bson.objectid import ObjectId

prompts_bp = Blueprint('prompts', __name__)

@prompts_bp.route('/prompts', methods=['GET'])
def get_all_prompts():
    """Get all prompts"""
    try:
        prompts = list(prompts_collection.find({"active": True}))
        for prompt in prompts:
            prompt['_id'] = str(prompt['_id'])
        return jsonify(prompts), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@prompts_bp.route('/prompts/<prompt_id>', methods=['GET'])
def get_prompt(prompt_id):
    """Get a specific prompt by ID"""
    try:
        prompt = prompts_collection.find_one({"_id": ObjectId(prompt_id)})
        if not prompt:
            return jsonify({"error": "Prompt not found"}), 404
        prompt['_id'] = str(prompt['_id'])
        return jsonify(prompt), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@prompts_bp.route('/admin/prompts', methods=['POST'])
def update_prompt():
    """Update an existing prompt"""
    try:
        data = request.json
        prompt_id = data.get('_id')
        # print(data)
        
        if not prompt_id:
            return jsonify({"error": "Prompt ID is required"}), 400
        
        update_data = {
            "prompt_text": data.get('prompt_text'),
            "description": data.get('description')
        }
        
        result = prompts_collection.update_one(
            {"_id": ObjectId(prompt_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Prompt not found or no changes made"}), 404
        
        return jsonify({"message": "Prompt updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@prompts_bp.route('/admin/prompts/<prompt_id>', methods=['PUT'])
def update_prompt_by_id(prompt_id):
    """Update a prompt by ID"""
    try:
        data = request.json
        print(data)
        
        update_data = {
            "prompt_text": data.get('prompt_text'),
            "description": data.get('description')
        }
        
        result = prompts_collection.update_one(
            {"_id": ObjectId(prompt_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Prompt not found or no changes made"}), 404
        
        return jsonify({"message": "Prompt updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
