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

ITEMS = [
    # APPROVED FOUND items
    {
        "title": "Blue Hydro Flask",
        "description": "32 oz dark blue Hydro Flask with a dent near the bottom. Has a mountain sticker on the side.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Cafeteria",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1602143407151-01114192003b?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "TI-84 Plus Calculator",
        "description": "Texas Instruments TI-84 Plus CE graphing calculator. Silver edition with a cracked screen protector.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Room G122",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1564466809058-bf4114d55352?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Red JanSport Backpack",
        "description": "Classic red JanSport backpack with several keychains attached to the zipper. Contains notebooks and pencils.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Library",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "AirPods Pro Case",
        "description": "White AirPods Pro charging case. No AirPods inside. Small scratch on the lid.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Gym Bleachers",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1588156979435-379b9d802b0a?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Black North Face Jacket",
        "description": "Men's medium black North Face puffer jacket. Has a small tear on the left sleeve.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Auditorium",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1544923246-77307dd270b5?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Samsung Galaxy Buds",
        "description": "Black Samsung Galaxy Buds case with buds inside. Case has a small chip on the corner.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Room E204",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Calculus Textbook",
        "description": "AP Calculus BC textbook, 8th edition. Name written inside the front cover but partially erased.",
        "category": "Books",
        "type": "FOUND",
        "location": "Courtyard Bench",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Car Keys with Honda Fob",
        "description": "Honda car key fob with two house keys and a small flashlight keychain attached.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Parking Lot B",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Prescription Glasses",
        "description": "Black rectangular frame prescription glasses in a brown leather case.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Media Center",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Green Lunchbox",
        "description": "Insulated green lunchbox with a zipper closure. Still has containers inside.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Cafeteria",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&q=80&w=800"
    },
    # APPROVED LOST items
    {
        "title": "Silver MacBook Charger",
        "description": "Apple 67W USB-C MacBook charger. Has a small piece of blue tape on the cable.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Room F201",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Gray Nike Hoodie",
        "description": "Nike Dri-FIT gray pullover hoodie, size medium. Has a small hole near the front pocket.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Weight Room",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "iPhone Charger Cable",
        "description": "White Apple Lightning to USB-C cable, about 3 feet long. Slightly frayed at the Lightning end.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Room E102",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1586953208270-767889db1422?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Blue Adidas Sweatpants",
        "description": "Navy blue Adidas track pants with white stripes. Size large. Elastic ankles.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Boys Locker Room",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "USB Flash Drive",
        "description": "32GB SanDisk Cruzer USB drive. Red and black color. Has class project files on it.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Computer Lab",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Maroon Scarf",
        "description": "Knitted maroon and gray striped scarf. About 5 feet long.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Front Office",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Spiral Notebook",
        "description": "Five Star 5-subject spiral notebook, black cover. Has chemistry and English notes inside.",
        "category": "Books",
        "type": "LOST",
        "location": "Room F105",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Wireless Mouse",
        "description": "Logitech M185 wireless mouse, gray. USB receiver may still be plugged into a school computer.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Media Center",
        "status": "APPROVED",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800"
    },
    # PENDING items (awaiting admin review)
    {
        "title": "Black Umbrella",
        "description": "Large black automatic umbrella with wooden handle. Found leaning against the wall.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Main Entrance",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1534309466160-70b22cc6254d?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Beats Headphones",
        "description": "Red Beats Solo3 wireless headphones. Right ear cushion is slightly worn.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Band Room",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Spanish Textbook",
        "description": "Realidades 2 Spanish textbook. Name written inside cover but mostly faded.",
        "category": "Books",
        "type": "FOUND",
        "location": "Room E301",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "White Nike Air Forces",
        "description": "Pair of white Nike Air Force 1 shoes, size 10. Left shoe has a grass stain on the toe.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Track Field",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Graphing Calculator",
        "description": "TI-Nspire CX II calculator. Has name label on the back that is peeling off.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Room G118",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1564466809058-bf4114d55352?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Denim Jacket",
        "description": "Levi's denim jacket, women's size small. Has a pin on the left lapel.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Art Room",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Water Bottle (Nalgene)",
        "description": "32 oz clear purple Nalgene water bottle with various travel stickers.",
        "category": "Personal Items",
        "type": "LOST",
        "location": "Cafeteria",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1523362628745-0c100fc988a1?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Pencil Case",
        "description": "Blue canvas pencil case with zipper. Contains pens, pencils, highlighters, and an eraser.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Room F201",
        "status": "PENDING",
        "imageUrl": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800"
    },
    # REJECTED items
    {
        "title": "Old Textbook",
        "description": "Torn and heavily damaged textbook. Unclear which class it belongs to.",
        "category": "Books",
        "type": "FOUND",
        "location": "Dumpster Area",
        "status": "REJECTED",
        "imageUrl": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Broken Earbuds",
        "description": "Wired earbuds with a broken left earbud. Brand unknown.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Hallway B",
        "status": "REJECTED",
        "imageUrl": "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Single Glove",
        "description": "One black winter glove, right hand. No brand visible.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Bus Loop",
        "status": "REJECTED",
        "imageUrl": "https://images.unsplash.com/photo-1545170241-e8af0ecdc4c0?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Cracked Phone Case",
        "description": "Clear iPhone case, heavily cracked. No phone inside.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Parking Lot A",
        "status": "REJECTED",
        "imageUrl": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&q=80&w=800"
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
        print(f"  [{icon}] {item['title']:30s}  {item['type']:5s}  {item['status']:8s}  @ {item['location']}")

    approved = sum(1 for i in ITEMS if i["status"] == "APPROVED")
    pending = sum(1 for i in ITEMS if i["status"] == "PENDING")
    rejected = sum(1 for i in ITEMS if i["status"] == "REJECTED")
    print(f"\nDone! {len(ITEMS)} items added.")
    print(f"  {approved} APPROVED  |  {pending} PENDING  |  {rejected} REJECTED")


if __name__ == "__main__":
    seed_database()
