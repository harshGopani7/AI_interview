from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import candidate_interview

mock_interview_bp = Blueprint('mock_interview', __name__)

@mock_interview_bp.route('/create', methods=['POST'])
@jwt_required()
def create_mock_interview():
    """Create a new mock interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        mock_interview = {
            'user_id': current_user_id,
            'jobDetails': data.get('jobDetails', {}),
            'skillSource': {
                'sourceType': data.get('skillSource', {}).get('sourceType'),
                'jobDescription': data.get('skillSource', {}).get('jobDescription', ''),
                'resumeFileName': data.get('skillSource', {}).get('resumeFileName', '')
            },
            'skills': data.get('skills', {}),
            'status': 'active',
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        result = candidate_interview.insert_one(mock_interview)
        mock_interview['_id'] = str(result.inserted_id)
        
        return jsonify({
            'message': 'Mock interview created successfully',
            'mock': {
                'id': str(result.inserted_id),
                'jobDetails': mock_interview['jobDetails'],
                'skillSource': mock_interview['skillSource'],
                'skills': mock_interview['skills'],
                'status': mock_interview['status'],
                'createdAt': mock_interview['createdAt']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mock_interview_bp.route('/list', methods=['GET'])
@jwt_required()
def list_mock_interviews():
    """Get all mock interviews for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        mocks = list(candidate_interview.find({
            'user_id': current_user_id
        }).sort('createdAt', -1))
        
        # Convert ObjectId to string
        for mock in mocks:
            mock['id'] = str(mock['_id'])
            del mock['_id']
            del mock['user_id']
        
        return jsonify({'mocks': mocks}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mock_interview_bp.route('/update/<mock_id>', methods=['PUT'])
@jwt_required()
def update_mock_interview(mock_id):
    """Update an existing mock interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        # Verify ownership
        mock = candidate_interview.find_one({
            '_id': ObjectId(mock_id),
            'user_id': current_user_id
        })
        
        if not mock:
            return jsonify({'error': 'Mock interview not found'}), 404
        
        update_data = {
            'jobDetails': data.get('jobDetails', {}),
            'skillSource': {
                'sourceType': data.get('skillSource', {}).get('sourceType'),
                'jobDescription': data.get('skillSource', {}).get('jobDescription', ''),
                'resumeFileName': data.get('skillSource', {}).get('resumeFileName', '')
            },
            'skills': data.get('skills', {}),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        candidate_interview.update_one(
            {'_id': ObjectId(mock_id)},
            {'$set': update_data}
        )
        
        return jsonify({
            'message': 'Mock interview updated successfully',
            'mock': {
                'id': mock_id,
                **update_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mock_interview_bp.route('/delete/<mock_id>', methods=['DELETE'])
@jwt_required()
def delete_mock_interview(mock_id):
    """Delete a mock interview"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify ownership
        result = candidate_interview.delete_one({
            '_id': ObjectId(mock_id),
            'user_id': current_user_id
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Mock interview not found'}), 404
        
        return jsonify({'message': 'Mock interview deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mock_interview_bp.route('/get/<mock_id>', methods=['GET'])
@jwt_required()
def get_mock_interview(mock_id):
    """Get a specific mock interview"""
    try:
        current_user_id = get_jwt_identity()
        
        mock = candidate_interview.find_one({
            '_id': ObjectId(mock_id),
            'user_id': current_user_id
        })
        
        if not mock:
            return jsonify({'error': 'Mock interview not found'}), 404
        
        mock['id'] = str(mock['_id'])
        del mock['_id']
        del mock['user_id']
        
        return jsonify({'mock': mock}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
