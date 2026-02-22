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
    # ===================== APPROVED FOUND items (8) =====================
    {
        "title": "Blue North Face Backpack",
        "description": "Blue and black North Face backpack found hanging on a chair. Has a water bottle pocket on the side and a small keychain attached to the zipper.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Cafeteria",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1553062407-98eeb64c6a62")
    },
    {
        "title": "AirPods Pro in Charging Case",
        "description": "White Apple AirPods Pro in a white charging case. Found on a desk after 3rd period. No engraving or name on them.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Room E204",
        "status": "APPROVED",
        "highValue": True,
        "imageUrl": img("photo-1600294037681-c80b4cb5b434")
    },
    {
        "title": "Black Frame Prescription Glasses",
        "description": "Black rectangular prescription eyeglasses found on a table in the media center. No case included. Lightweight plastic frames.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Media Center",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1574258495973-f7977603b6d2")
    },
    {
        "title": "Red Hydro Flask Water Bottle",
        "description": "32 oz red Hydro Flask with a few stickers on it including a mountain design and a smiley face. Found on the bleachers after lunch.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Gym Bleachers",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1536939459926-301728717817")
    },
    {
        "title": "Car Keys with Lanyard Keychain",
        "description": "Set of car keys on a black lanyard keychain. Has a Toyota key fob and two other small keys. Found on the ground near the student lot.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Parking Lot B",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1582139329536-e7284fece509")
    },
    {
        "title": "Silver MacBook Pro Laptop",
        "description": "13-inch silver MacBook Pro found in the library study room. Has a clear hard case and a small scratch on the top lid. Password locked.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Library Study Room 3",
        "status": "APPROVED",
        "highValue": True,
        "imageUrl": img("photo-1517336714731-489689fd1ca8")
    },
    {
        "title": "Black Compact Umbrella",
        "description": "Black automatic compact umbrella found leaning against the wall by the front entrance after the rainstorm on Monday.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Main Entrance",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1534309466160-70b22cc6254b")
    },
    {
        "title": "Chemistry Textbook",
        "description": "AP Chemistry textbook (Zumdahl, 10th edition) found on a bench. Has sticky notes and highlights throughout. Name on inside cover is smudged.",
        "category": "Books",
        "type": "FOUND",
        "location": "Courtyard Bench",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1497633762265-9d179a990aa6")
    },

    # ===================== APPROVED LOST items (7) =====================
    {
        "title": "Gold Hoop Earrings",
        "description": "Pair of medium-sized gold hoop earrings. One fell off during PE and I couldn't find it. They have sentimental value — gift from my grandmother.",
        "category": "Personal Items",
        "type": "LOST",
        "location": "Gym",
        "status": "APPROVED",
        "highValue": True,
        "imageUrl": img("photo-1630019852942-f89202989a59")
    },
    {
        "title": "Gray Nike Hoodie",
        "description": "Gray Nike pullover hoodie, size medium. Has a small bleach stain on the left sleeve. Left it on the back of my chair in 4th period.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Room F201",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1556821840-3a63f95609a7")
    },
    {
        "title": "TI-84 Plus Graphing Calculator",
        "description": "TI-84 Plus CE graphing calculator in black. Has my initials 'JM' written in silver sharpie on the back. Need it for my AP Calc exam.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Room G118",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1564466809058-bf4114d55352")
    },
    {
        "title": "Black Leather Wallet",
        "description": "Black leather bifold wallet. Contains my student ID and a $20 Starbucks gift card. Last had it at lunch.",
        "category": "Personal Items",
        "type": "LOST",
        "location": "Cafeteria",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1627123424574-724758594e93")
    },
    {
        "title": "Blue Denim Jacket",
        "description": "Light wash blue denim jacket, women's size small. Has a small enamel pin on the collar (daisy design). Left it in the art room.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Art Room",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1576995853123-5a10305d93c0")
    },
    {
        "title": "iPhone 15 with Cracked Screen",
        "description": "iPhone 15 in a clear case. Screen has a crack in the top right corner. Has a photo of my dog as the lock screen wallpaper.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Main Hallway",
        "status": "APPROVED",
        "highValue": True,
        "imageUrl": img("photo-1601784551446-20c9e07cdbdb")
    },
    {
        "title": "Wireless Mouse (White)",
        "description": "White Logitech wireless mouse. Left it plugged into a computer in the media center. Has a small scratch on the bottom.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Media Center",
        "status": "APPROVED",
        "highValue": False,
        "imageUrl": img("photo-1527864550417-7fd91fc51a46")
    },

    # ===================== PENDING items (7) =====================
    {
        "title": "Varsity Letterman Jacket",
        "description": "Black and gold varsity letterman jacket with 'MRHS' on the back. Found draped over the railing near the gym entrance.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Gym Entrance",
        "status": "PENDING",
        "highValue": False,
        "imageUrl": img("photo-1591047139829-d91aecb6caea")
    },
    {
        "title": "USB Flash Drive (Black)",
        "description": "Small black USB flash drive found plugged into a library computer. Brand looks like SanDisk.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Library Computer Lab",
        "status": "PENDING",
        "highValue": False,
        "imageUrl": img("photo-1618410320928-25228d811631")
    },
    {
        "title": "Blue Insulated Lunch Bag",
        "description": "Blue insulated lunch bag with a zipper top. Found in the cafeteria after lunch period. Has containers inside.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Cafeteria",
        "status": "PENDING",
        "highValue": False,
        "imageUrl": img("photo-1604467707321-70d009801bf9")
    },
    {
        "title": "Student ID on Lanyard",
        "description": "School ID badge on a red lanyard. Found on the floor in the B hallway. Name is partially visible.",
        "category": "Personal Items",
        "type": "FOUND",
        "location": "Hallway B",
        "status": "PENDING",
        "highValue": False,
        "imageUrl": img("photo-1671726203449-34e89df45211")
    },
    {
        "title": "Pencil Case with Supplies",
        "description": "Lost my gray canvas pencil case with all my drawing supplies — mechanical pencils, erasers, and colored pens. Had it in art class.",
        "category": "Personal Items",
        "type": "LOST",
        "location": "Art Room",
        "status": "PENDING",
        "highValue": False,
        "imageUrl": img("photo-1513542789411-b6a5d4f31634")
    },
    {
        "title": "Apple Watch Series 9",
        "description": "Lost my Apple Watch with a black sport band. Took it off before gym and forgot to grab it. Has a green watch face.",
        "category": "Electronics",
        "type": "LOST",
        "location": "Boys Locker Room",
        "status": "PENDING",
        "highValue": True,
        "imageUrl": img("photo-1546868871-af0de0ae72be")
    },
    {
        "title": "North Face Puffer Jacket",
        "description": "Black North Face 700 fill puffer jacket, men's size large. Left it in the auditorium during the assembly.",
        "category": "Clothing",
        "type": "LOST",
        "location": "Auditorium",
        "status": "PENDING",
        "highValue": True,
        "imageUrl": img("photo-1544923246-77307dd270b0")
    },

    # ===================== REJECTED items (3) =====================
    {
        "title": "Broken Wired Earbuds",
        "description": "Wired earbuds with a frayed cable and broken left earbud. Found on the floor. Too damaged to be claimed.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Hallway C",
        "status": "REJECTED",
        "highValue": False,
        "imageUrl": ""
    },
    {
        "title": "Single Worn Glove",
        "description": "One black winter glove, right hand only. Heavily worn with holes in the fingers. Found near the bus loop.",
        "category": "Clothing",
        "type": "FOUND",
        "location": "Bus Loop",
        "status": "REJECTED",
        "highValue": False,
        "imageUrl": ""
    },
    {
        "title": "Cracked Empty Phone Case",
        "description": "Clear iPhone case, heavily cracked and yellowed. No phone inside. Found in trash area near parking lot.",
        "category": "Electronics",
        "type": "FOUND",
        "location": "Parking Lot A",
        "status": "REJECTED",
        "highValue": False,
        "imageUrl": ""
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
        hv = " [HIGH VALUE]" if item.get("highValue") else ""
        print(f"  [{icon}] {item['title']:40s}  {item['type']:5s}  {item['status']:8s}  @ {item['location']}{hv}")

    approved = sum(1 for i in ITEMS if i["status"] == "APPROVED")
    pending = sum(1 for i in ITEMS if i["status"] == "PENDING")
    rejected = sum(1 for i in ITEMS if i["status"] == "REJECTED")
    high_value = sum(1 for i in ITEMS if i.get("highValue"))
    print(f"\nDone! {len(ITEMS)} items added.")
    print(f"  {approved} APPROVED  |  {pending} PENDING  |  {rejected} REJECTED")
    print(f"  {high_value} HIGH VALUE items")


if __name__ == "__main__":
    seed_database()
