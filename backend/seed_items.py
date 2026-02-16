"""
Script to inject realistic lost and found items into Firebase database.
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

# Unsplash CDN base URL helper
def img(photo_id):
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=800&q=80"

ITEMS = [
    # ===================== APPROVED FOUND items (10) =====================
    {
        "title": "Blue Reusable Water Bottle",
        "description": "Blue and white reusable water bottle, looks like a LARQ or similar brand. Found on a desk after class.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Cafeteria",
        "status": "APPROVED",
        "imageUrl": img("photo-1611190346465-12f6b1ad0c06")
    },
    {
        "title": "Scientific Calculator",
        "description": "Standard scientific calculator found on a desk with some loose paper. No name written on it.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Room G122",
        "status": "APPROVED",
        "imageUrl": img("photo-1648201188793-418f2b9b4b32")
    },
    {
        "title": "AirPods Pro with Case",
        "description": "White Apple AirPods Pro in charging case. Found on a blue surface near the science wing.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Room E204",
        "status": "APPROVED",
        "imageUrl": img("photo-1606841837239-c5a1a4a07af7")
    },
    {
        "title": "Blue School Backpack",
        "description": "Blue backpack found next to a laptop and textbook. Has a front zipper pocket. No ID tags visible.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Library",
        "status": "APPROVED",
        "imageUrl": img("photo-1535982330050-f1c2fb79ff78")
    },
    {
        "title": "Black Wireless Headphones",
        "description": "Over-ear black wireless headphones. Good condition, no visible brand name. Found on a bench.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Gym Bleachers",
        "status": "APPROVED",
        "imageUrl": img("photo-1567928513899-997d98489fbd")
    },
    {
        "title": "Brown Leather Wallet",
        "description": "Brown leather bifold wallet found on a table. Contains no cash but has a student ID inside (turned in to office).",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Cafeteria",
        "status": "APPROVED",
        "imageUrl": img("photo-1531190260877-c8d11eb5afaf")
    },
    {
        "title": "Car Keys with Keychain",
        "description": "Set of black and silver car keys found on a dark surface near the parking lot entrance.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Parking Lot B",
        "status": "APPROVED",
        "imageUrl": img("photo-1603508102977-02688e3265fd")
    },
    {
        "title": "Black Frame Prescription Glasses",
        "description": "Black rectangular prescription eyeglasses found on a white desk. No case included.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Media Center",
        "status": "APPROVED",
        "imageUrl": img("photo-1519419166318-4f5c601b8e6c")
    },
    {
        "title": "Apple MacBook Charger",
        "description": "White Apple USB-C charging adapter found on a table. No cable attached, just the brick.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Room F201",
        "status": "APPROVED",
        "imageUrl": img("photo-1583863788434-e58a36330cf0")
    },
    {
        "title": "Spiral Notebook with Notes",
        "description": "Spiral-bound notebook with handwritten notes inside. Has a fountain pen clipped to the cover.",
        "category": "Books",
        "type": "FOUND",
        "location": "Courtyard Bench",
        "status": "APPROVED",
        "imageUrl": img("photo-1471107340929-a87cd0f5b5f3")
    },

    # ===================== APPROVED LOST items (8) =====================
    {
        "title": "iPhone with Blue Case",
        "description": "Black iPhone XS in a blue protective case. Last seen near a succulent plant display in the main hall.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Main Hallway",
        "status": "APPROVED",
        "imageUrl": img("photo-1547658718-f4311ad64746")
    },
    {
        "title": "White Lightning Charging Cable",
        "description": "White Apple Lightning to USB cable, about 3 feet long. Left plugged into a wall outlet.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Room E102",
        "status": "APPROVED",
        "imageUrl": img("photo-1587037542794-6ca5f4772330")
    },
    {
        "title": "Silver Analog Wristwatch",
        "description": "Round silver analog watch with black leather strap. Has sentimental value. Lost during gym class.",
        "category": "Personal Items",
        "type": "LOST",
        "location": "Weight Room",
        "status": "APPROVED",
        "imageUrl": img("photo-1436076838903-fd4dd41d99c4")
    },
    {
        "title": "White Nike Air Force 1",
        "description": "Single white Nike Air Force 1 sneaker, right foot, size 10. Left behind after basketball practice.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Gym",
        "status": "APPROVED",
        "imageUrl": img("photo-1618453292437-5379bfbbf94d")
    },
    {
        "title": "Black Wireless Earbuds",
        "description": "Black and gray wireless earbuds in a small charging case. Sony or similar brand. Fell out of my pocket.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Auditorium",
        "status": "APPROVED",
        "imageUrl": img("photo-1598900863662-da1c3e6dd9d9")
    },
    {
        "title": "Denim Jacket",
        "description": "Blue washed denim jacket, women's size small. Was hanging on the back of a door or chair.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Art Room",
        "status": "APPROVED",
        "imageUrl": img("photo-1543076447-215ad9ba6923")
    },
    {
        "title": "Stack of Textbooks",
        "description": "3-4 assorted textbooks left on a wooden table. Subjects include history and English lit.",
        "category": "Books",
        "type": "LOST",
        "location": "Library",
        "status": "APPROVED",
        "imageUrl": img("photo-1516979187457-637abb4f9353")
    },
    {
        "title": "Gray Nike Running Shoe",
        "description": "Single unpaired gray Nike running shoe, left foot. Was in my gym bag which got mixed up.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Boys Locker Room",
        "status": "APPROVED",
        "imageUrl": img("photo-1491553895911-0055eca6402d")
    },

    # ===================== PENDING items (8) =====================
    {
        "title": "Black Umbrella",
        "description": "Large black automatic umbrella found leaning against the wall near the main entrance after rain.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Main Entrance",
        "status": "PENDING",
        "imageUrl": img("photo-1560523666-da919cd231af")
    },
    {
        "title": "White Nike Air Force 1 Low",
        "description": "White Nike Air Force 1 Low sneaker photographed against dark background. Found in hallway.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Hallway B",
        "status": "PENDING",
        "imageUrl": img("photo-1608231387042-66d1773070a5")
    },
    {
        "title": "Small Black Earbuds",
        "description": "Pair of small black wireless earbuds found on a white table in the testing center.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Testing Center",
        "status": "PENDING",
        "imageUrl": img("photo-1632200004922-bc18602c79fc")
    },
    {
        "title": "Brown Wallet",
        "description": "Brown leather bifold wallet found on the concrete floor near the vending machines.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Vending Area",
        "status": "PENDING",
        "imageUrl": img("photo-1614260937560-c749cc17da94")
    },
    {
        "title": "Pair of White Nike Sneakers",
        "description": "Pair of white Nike Air Force 1 sneakers, size 9. Found in a plastic bag near the track.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Track Field",
        "status": "PENDING",
        "imageUrl": img("photo-1558079498-d41c80254734")
    },
    {
        "title": "TI-84 Graphing Calculator",
        "description": "TI-84 or similar graphing calculator. Has a name label on the back that is peeling off.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Room G118",
        "status": "PENDING",
        "imageUrl": img("photo-1648201188793-418f2b9b4b32")
    },
    {
        "title": "Gray Pullover Hoodie",
        "description": "Gray pullover hoodie seen on someone near the courtyard. Nike or similar brand, size medium.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Courtyard",
        "status": "PENDING",
        "imageUrl": img("photo-1576211473184-a3a1da6216b7")
    },
    {
        "title": "Water Bottle (Purple Nalgene)",
        "description": "32 oz clear purple Nalgene water bottle with various travel stickers. Left in the cafeteria.",
        "category": "Personal Items",
        "type": "LOST",
        "location": "Cafeteria",
        "status": "PENDING",
        "imageUrl": img("photo-1611190346465-12f6b1ad0c06")
    },

    # ===================== REJECTED items (4) =====================
    {
        "title": "Broken Earbuds",
        "description": "Wired earbuds with a broken left earbud. Brand unknown. Too damaged to return.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Hallway B",
        "status": "REJECTED",
        "imageUrl": img("photo-1632200004922-bc18602c79fc")
    },
    {
        "title": "Old Damaged Textbook",
        "description": "Torn and heavily water-damaged textbook. Pages are stuck together. Unclear which class it belongs to.",
        "category": "Books",
        "type": "FOUND",
        "location": "Dumpster Area",
        "status": "REJECTED",
        "imageUrl": img("photo-1516979187457-637abb4f9353")
    },
    {
        "title": "Single Worn Glove",
        "description": "One black winter glove, right hand. Heavily worn with holes. No brand visible.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Bus Loop",
        "status": "REJECTED",
        "imageUrl": ""
    },
    {
        "title": "Cracked Phone Case (Empty)",
        "description": "Clear iPhone case, heavily cracked and yellowed. No phone inside. Not worth claiming.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Parking Lot A",
        "status": "REJECTED",
        "imageUrl": img("photo-1547658718-f4311ad64746")
    },
]


def generate_date():
    """Generate a random date within the last 3 weeks"""
    days_ago = random.randint(0, 21)
    date = datetime.now() - timedelta(days=days_ago)
    return date.strftime("%Y-%m-%d")


def seed_database():
    items_ref = db.reference('items')

    # Clear existing items
    print("Clearing existing items...")
    items_ref.delete()

    print(f"Seeding database with {len(ITEMS)} items...\n")

    for item in ITEMS:
        item["date"] = generate_date()
        item["createdAt"] = datetime.now().isoformat()
        item["owner"] = "seed_script"

        new_ref = items_ref.push(item)
        icon = {"APPROVED": "+", "PENDING": "~", "REJECTED": "x"}[item["status"]]
        print(f"  [{icon}] {item['title']:40s}  {item['type']:5s}  {item['status']:8s}  @ {item['location']}")

    approved = sum(1 for i in ITEMS if i["status"] == "APPROVED")
    pending = sum(1 for i in ITEMS if i["status"] == "PENDING")
    rejected = sum(1 for i in ITEMS if i["status"] == "REJECTED")
    print(f"\nDone! {len(ITEMS)} items added.")
    print(f"  {approved} APPROVED  |  {pending} PENDING  |  {rejected} REJECTED")


if __name__ == "__main__":
    seed_database()
