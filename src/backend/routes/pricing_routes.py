from flask import Blueprint, request, jsonify
from bson import ObjectId
from config import db

pricing_bp = Blueprint('pricing', __name__)
pricing_col = db['pricing']

# GET ALL PRICING (Public)
@pricing_bp.route('/pricing', methods=['GET'])
def get_pricing():
    plans = list(pricing_col.find())
    for plan in plans:
        plan['_id'] = str(plan['_id']) # Convert ObjectId to string
    return jsonify(plans), 200

# CREATE/UPDATE TIER (Admin Protected - add your auth decorator here)
@pricing_bp.route('/admin/pricing', methods=['POST'])
def save_pricing():
    data = request.json
    plan_id = data.get('_id')
    
    plan_data = {
        'name': data['name'],
        'price': data['price'],
        'description': data['description'],
        'features': data['features'], # Expected as an array
        'isPopular': data.get('isPopular', False),
        'variant': data.get('variant', 'secondary'),
        'stripe_price_id': data.get('stripe_price_id'),
        'razorpay_plan_id': data.get('razorpay_plan_id', ''),
        'cv_limit': int(data.get('cv_limit', 0)) if data.get('cv_limit') is not None else 0,
        'interview_limit': int(data.get('interview_limit', 0)) if data.get('interview_limit') is not None else 0
    }

    if plan_id:
        pricing_col.update_one({'_id': ObjectId(plan_id)}, {'$set': plan_data})
        return jsonify({'message': 'Plan updated'}), 200
    else:
        pricing_col.insert_one(plan_data)
        return jsonify({'message': 'Plan created'}), 201

# DELETE TIER
@pricing_bp.route('/admin/pricing/<id>', methods=['DELETE'])
def delete_pricing(id):
    pricing_col.delete_one({'_id': ObjectId(id)})
    return jsonify({'message': 'Plan deleted'}), 200