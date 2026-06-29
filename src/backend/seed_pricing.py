import pymongo
from pymongo.errors import ServerSelectionTimeoutError
from config import db

try:

    pricing_collection = db['pricing']

    # Clear existing data
    pricing_collection.delete_many({})

    # Seed data
    plans = [
        {
            'name': 'Basic',
            'price': '0',
            'description': 'Perfect for exploring the platform',
            'features': ['2 AI Interviews per month', 'Basic Performance Score', 'Standard Questions', 'Email Support'],
            'isPopular': False,
            'variant': 'secondary',
            'cv_limit': 10,
            'interview_limit': 5
        },
        {
            'name': 'Gold',
            'price': '29',
            'description': 'Ideal for serious job seekers',
            'features': ['Unlimited Practice', 'Advanced AI Evaluation', 'Industry Specific Sets', 'Priority Email Support', 'Resume Analysis'],
            'isPopular': True,
            'variant': 'primary',
            'cv_limit': 60,
            'interview_limit': 30
        },
        {
            'name': 'Platinum',
            'price': '99',
            'description': 'Designed for institutional scale',
            'features': ['Team Management', 'Organization Dashboard', 'White-label Reports', 'API Access', 'Dedicated Account Manager'],
            'isPopular': False,
            'variant': 'dark',
            'cv_limit': 200,
            'interview_limit': 100
        }
    ]

    # Insert seed data
    pricing_collection.insert_many(plans)
    print('Pricing data seeded successfully.')
except ServerSelectionTimeoutError as e:
    print('Error connecting to MongoDB. Please ensure MongoDB is running on localhost:27017.')
    print(e)
except Exception as e:
    print('An error occurred:')
    print(e)
finally:
    if 'client' in locals():
        client.close()
