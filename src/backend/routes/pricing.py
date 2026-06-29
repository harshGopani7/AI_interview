from flask import Blueprint, request, jsonify
import pymongo
from pymongo.errors import ServerSelectionTimeoutError
from config import db

try:
    pricing_collection = db['pricing']
except Exception as e:
    print('An error occurred while connecting to MongoDB:')
    print(e)
    pricing_collection = None

pricing_bp = Blueprint('pricing', __name__)

@pricing_bp.route('/api/pricing', methods=['GET'])
def get_pricing():
    if pricing_collection is None:
        return jsonify({'message': 'Database connection error'}), 503
    try:
        plans = list(pricing_collection.find())
        for plan in plans:
            plan['_id'] = str(plan['_id'])
        return jsonify(plans)
    except Exception as e:
        print(e)
        return jsonify({'message': 'Server error'}), 500

@pricing_bp.route('/api/pricing', methods=['POST'])
def add_pricing():
    if pricing_collection is None:
        return jsonify({'message': 'Database connection error'}), 503
    try:
        new_plan = request.get_json()
        result = pricing_collection.insert_one(new_plan)
        new_plan['_id'] = str(result.inserted_id)
        return jsonify(new_plan), 201
    except Exception as e:
        print(e)
        return jsonify({'message': 'Invalid data'}), 400

@pricing_bp.route('/api/pricing/<id>', methods=['PUT'])
def update_pricing(id):
    if pricing_collection is None:
        return jsonify({'message': 'Database connection error'}), 503
    try:
        updated_plan = request.get_json()
        result = pricing_collection.find_one_and_update(
            {'_id': id},
            {'$set': updated_plan},
            return_document=pymongo.ReturnDocument.AFTER
        )
        if not result:
            return jsonify({'message': 'Plan not found'}), 404
        result['_id'] = str(result['_id'])
        return jsonify(result)
    except Exception as e:
        print(e)
        return jsonify({'message': 'Invalid data'}), 400

@pricing_bp.route('/api/pricing/<id>', methods=['DELETE'])
def delete_pricing(id):
    if pricing_collection is None:
        return jsonify({'message': 'Database connection error'}), 503
    try:
        result = pricing_collection.find_one_and_delete({'_id': id})
        if not result:
            return jsonify({'message': 'Plan not found'}), 404
        return jsonify({'message': 'Plan deleted successfully'})
    except Exception as e:
        print(e)
        return jsonify({'message': 'Server error'}), 500
