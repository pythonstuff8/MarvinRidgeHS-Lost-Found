"""
Script to inject fake lost and found items into Firebase database.
Run this from the backend directory: python seed_items.py
"""

import firebase_admin
from firebase_admin import credentials, db
import os
import json
from datetime import datetime, timedelta
import random

# Initialize Firebase
firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS")

if firebase_creds_json:
    cred_dict = json.loads(firebase_creds_json)
    cred = credentials.Certificate(cred_dict)
else:
    cred_paths = [
        "../fblalf-firebase-adminsdk-fbsvc-ce8e5771c0.json",
        "fblalf-firebase-adminsdk-fbsvc-ce8e5771c0.json"
    ]
    cred_path = next((p for p in cred_paths if os.path.exists(p)), None)
    if cred_path:
        cred = credentials.Certificate(cred_path)
    else:
        raise Exception("Firebase credentials not found!")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://fblalf-default-rtdb.firebaseio.com/'
    })

# Sample items to inject
FAKE_ITEMS = [
    # APPROVED LOST items
    {
        "title": "Blue Water Bottle",
        "description": "Hydro Flask, dark blue with stickers. Has a dent on the bottom.",
        "category": "Personal Items",
        "type": "LOST",
        "location": "F201",
        "status": "APPROVED",
        "imageUrl": ""
    },
    {
        "title": "AirPods Pro Case",
        "description": "White AirPods Pro case, no AirPods inside. Has initials 'JM' scratched on back.",
        "category": "Electronics",
        "type": "LOST",
        "location": "E204",
        "status": "APPROVED",
        "imageUrl": ""
    },
    {
        "title": "Gray Hoodie",
        "description": "Nike gray hoodie, size medium. Has a small hole near the pocket.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Cafeteria",
        "status": "APPROVED",
        "imageUrl": ""
    },
    # APPROVED FOUND items
    {
        "title": "TI-84 Calculator",
        "description": "Texas Instruments TI-84 Plus calculator. Name label worn off.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "G122",
        "status": "APPROVED",
        "imageUrl": ""
    },
    {
        "title": "Red Backpack",
        "description": "JanSport red backpack with various keychains. Contains notebooks.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "F120",
        "status": "APPROVED",
        "imageUrl": ""
    },
    {
        "title": "Car Keys",
        "description": "Honda car key with house keys attached. Has a small flashlight keychain.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "E105",
        "status": "APPROVED",
        "imageUrl": ""
    },
    # PENDING items (need admin approval)
    {
        "title": "MacBook Charger",
        "description": "Apple MacBook charger, white. 65W USB-C.",
        "category": "Electronics",
        "type": "LOST",
        "location": "E102",
        "status": "PENDING",
        "imageUrl": ""
    },
    {
        "title": "Black Umbrella",
        "description": "Large black umbrella with wooden handle. Automatic open.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "F105",
        "status": "PENDING",
        "imageUrl": ""
    },
    {
        "title": "Spanish Textbook",
        "description": "Realidades 2 textbook. Name written inside cover but faded.",
        "category": "Books",
        "type": "FOUND",
        "location": "Cafeteria",
        "status": "PENDING",
        "imageUrl": ""
    },
    {
        "title": "Wireless Earbuds",
        "description": "Samsung Galaxy Buds, black case. Found on desk.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "G122",
        "status": "PENDING",
        "imageUrl": ""
    },
]

def generate_date():
    """Generate a random date within the last 2 weeks"""
    days_ago = random.randint(0, 14)
    date = datetime.now() - timedelta(days=days_ago)
    return date.strftime("%Y-%m-%d")

def seed_database():
    items_ref = db.reference('items')
    
    print("Seeding database with fake items...")
    
    for item in FAKE_ITEMS:
        item["date"] = generate_date()
        item["createdAt"] = datetime.now().isoformat()
        item["owner"] = "seed_script"  # Placeholder owner
        
        new_ref = items_ref.push(item)
        status_icon = "✓" if item["status"] == "APPROVED" else "○"
        print(f"  {status_icon} Added: {item['title']} ({item['type']}, {item['status']}) @ {item['location']}")
    
    print(f"\nDone! Added {len(FAKE_ITEMS)} items to the database.")
    print(f"  - {sum(1 for i in FAKE_ITEMS if i['status'] == 'APPROVED')} APPROVED")
    print(f"  - {sum(1 for i in FAKE_ITEMS if i['status'] == 'PENDING')} PENDING")

if __name__ == "__main__":
    seed_database()
