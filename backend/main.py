from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db
import os
import json
from openai import OpenAI
import cloudinary
import cloudinary.uploader
import uuid

# Import AI config
from ai_config import (
    AI_ENABLED, OPENAI_API_KEY,
    TEXT_MODEL, VISION_MODEL, IMAGE_MOD_MODEL,
    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
)

app = FastAPI(title="Marvin Ridge Lost & Found API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase Init
firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS")

if firebase_creds_json:
    try:
        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://fblalf-default-rtdb.firebaseio.com/',
            'storageBucket': 'fblalf.appspot.com'
        })
        print("Firebase initialized via Environment Variable")
    except Exception as e:
        print(f"Error initializing Firebase from Env Var: {e}")
else:
    cred_paths = [
        "../fblalf-firebase-adminsdk-fbsvc-ce8e5771c0.json",
        "fblalf-firebase-adminsdk-fbsvc-ce8e5771c0.json"
    ]

    cred_path = next((p for p in cred_paths if os.path.exists(p)), None)

    if cred_path:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://fblalf-default-rtdb.firebaseio.com/',
            'storageBucket': 'fblalf.appspot.com'
        })
        print(f"Firebase initialized from file: {cred_path}")
    else:
        print(f"Warning: Firebase credentials not found. Checked: {cred_paths}")

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY) if AI_ENABLED and OPENAI_API_KEY else None

# Initialize Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)


# --- Models ---
class DescribeRequest(BaseModel):
    image_url: str

class SearchRequest(BaseModel):
    query: str

class ImageUploadRequest(BaseModel):
    image_base64: str

class ModerationRequest(BaseModel):
    title: str
    description: str
    category: str

class ImageModerationRequest(BaseModel):
    image_url: str


# --- Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "ai_enabled": AI_ENABLED and openai_client is not None,
        "service": "Marvin Ridge Lost & Found Backend",
        "text_model": TEXT_MODEL,
        "vision_model": VISION_MODEL
    }


@app.get("/api/ai-status")
def ai_status():
    return {"ai_enabled": AI_ENABLED and openai_client is not None}


@app.post("/api/upload-image")
async def upload_image(request: ImageUploadRequest):
    try:
        image_data = request.image_base64

        if "," in image_data:
            image_data = image_data.split(",")[1]

        public_id = f"lostfound/{uuid.uuid4().hex[:12]}"

        result = cloudinary.uploader.upload(
            f"data:image/jpeg;base64,{image_data}",
            public_id=public_id,
            folder="marvin_ridge_lf"
        )

        return {"url": result["secure_url"], "public_id": result["public_id"]}

    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


@app.post("/api/moderate-content")
async def moderate_content(request: ModerationRequest):
    """AI text moderation using GPT-4.1-nano (cheapest, fastest)"""
    if not AI_ENABLED or not openai_client:
        return {"approved": True, "reason": "AI moderation disabled"}

    try:
        completion = openai_client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": """You are a content moderator for a high school lost and found website.
You must check if submissions are appropriate. REJECT content that contains:
- Profanity, slurs, or offensive language
- Inappropriate or adult content
- Personal attacks or bullying
- Spam or irrelevant content (not a real lost/found item)
- Dangerous items (weapons, drugs, etc.)
- Personal information like phone numbers or addresses

Respond ONLY with:
APPROVED: true or false
REASON: brief explanation (one sentence)"""
                },
                {
                    "role": "user",
                    "content": f"Check this submission:\nTitle: {request.title}\nCategory: {request.category}\nDescription: {request.description}"
                }
            ],
            temperature=0.1,
            max_completion_tokens=100
        )

        output = completion.choices[0].message.content

        approved = True
        reason = "Content approved"

        for line in output.split('\n'):
            if 'APPROVED:' in line.upper():
                approved = 'true' in line.lower()
            elif 'REASON:' in line.upper():
                reason = line.split(':', 1)[1].strip() if ':' in line else reason

        return {"approved": approved, "reason": reason}

    except Exception as e:
        print(f"Moderation error: {e}")
        return {"approved": True, "reason": "Moderation check skipped"}


@app.post("/api/moderate-image")
async def moderate_image(request: ImageModerationRequest):
    """AI image moderation using GPT-4.1-nano vision (cheapest with vision)"""
    if not AI_ENABLED or not openai_client:
        return {"approved": True, "reason": "Image moderation disabled"}

    try:
        completion = openai_client.chat.completions.create(
            model=IMAGE_MOD_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": """You are an image content moderator for a high school lost and found website.
You must check if uploaded images are appropriate for a school environment. REJECT images that contain:
- Nudity or sexually suggestive content
- Violence, gore, or graphic content
- Weapons, drugs, or drug paraphernalia
- Offensive gestures, hate symbols, or inappropriate text
- Personal information visible (IDs, credit cards, addresses)
- Memes, jokes, or non-item images (must be a real lost/found item)
- Scary, disturbing, or inappropriate content for minors

APPROVE images that show:
- Lost/found items like water bottles, bags, electronics, clothing, books
- Normal everyday objects appropriate for a school setting

Respond ONLY with:
APPROVED: true or false
REASON: brief explanation (one sentence)"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Check if this image is appropriate for a high school lost and found website:"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": request.image_url
                            }
                        }
                    ]
                }
            ],
            max_tokens=100
        )

        output = completion.choices[0].message.content

        approved = True
        reason = "Image approved"

        for line in output.split('\n'):
            if 'APPROVED:' in line.upper():
                approved = 'true' in line.lower()
            elif 'REASON:' in line.upper():
                reason = line.split(':', 1)[1].strip() if ':' in line else reason

        return {"approved": approved, "reason": reason}

    except Exception as e:
        print(f"Image moderation error: {e}")
        return {"approved": True, "reason": "Image moderation check skipped"}


@app.post("/api/ai-search")
async def ai_search(request: SearchRequest):
    """AI-powered search using GPT-4.1-nano (cheapest, fastest)"""
    if not AI_ENABLED or not openai_client:
        return fallback_search(request.query)

    try:
        items_ref = db.reference('items')
        items_data = items_ref.get()

        if not items_data:
            return {"results": [], "corrected_query": request.query}

        items_list = []
        for item_id, item in items_data.items():
            if item.get('status') == 'APPROVED':
                items_list.append({
                    "id": item_id,
                    "title": item.get('title', ''),
                    "description": item.get('description', ''),
                    "type": item.get('type', ''),
                    "category": item.get('category', ''),
                    "location": item.get('location', ''),
                    "imageUrl": item.get('imageUrl', '')
                })

        if not items_list:
            return {"results": [], "corrected_query": request.query}

        items_context = "\n".join([
            f"ID:{i['id']} | {i['title']} | {i['category']} | {i['location']}"
            for i in items_list[:30]
        ])

        completion = openai_client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": """You are a search assistant for a lost and found system.
1. Correct any spelling errors in the user's search query.
2. Match items from the list that are relevant.
3. Return ONLY in this exact format:
CORRECTED: [corrected search term]
MATCHES: [comma-separated list of matching IDs, or "none" if no matches]"""
                },
                {
                    "role": "user",
                    "content": f"Items list:\n{items_context}\n\nUser search: \"{request.query}\""
                }
            ],
            temperature=0.3,
            max_completion_tokens=200
        )

        output = completion.choices[0].message.content

        corrected = request.query
        matching_ids = []

        for line in output.split('\n'):
            if line.startswith('CORRECTED:'):
                corrected = line.replace('CORRECTED:', '').strip()
            elif line.startswith('MATCHES:'):
                ids_str = line.replace('MATCHES:', '').strip()
                if ids_str.lower() != 'none':
                    matching_ids = [id.strip() for id in ids_str.split(',') if id.strip()]

        results = [item for item in items_list if item['id'] in matching_ids]

        if not results:
            search_lower = corrected.lower()
            results = [item for item in items_list if
                search_lower in item['title'].lower() or
                search_lower in item['description'].lower() or
                search_lower in item['category'].lower()
            ]

        return {"results": results[:10], "corrected_query": corrected}

    except Exception as e:
        print(f"AI Search error: {e}")
        return fallback_search(request.query)


def fallback_search(query: str):
    """Fallback to simple text search"""
    try:
        search_lower = query.lower()
        items_ref = db.reference('items')
        items_data = items_ref.get() or {}

        results = []
        for item_id, item in items_data.items():
            if item.get('status') == 'APPROVED':
                if (search_lower in item.get('title', '').lower() or
                    search_lower in item.get('description', '').lower()):
                    results.append({"id": item_id, **item})

        return {"results": results[:10], "corrected_query": query}
    except:
        return {"results": [], "corrected_query": query}


@app.post("/api/describe-image")
async def describe_image(request: DescribeRequest):
    """Describe an image using GPT-4.1-mini vision (best cost/perf for vision)"""
    if not AI_ENABLED or not openai_client:
        return {"description": "AI features are disabled. Please describe the item manually."}

    try:
        completion = openai_client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe this item for a lost and found listing. Include: color, brand (if visible), condition, and identifying features. Keep it under 50 words."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": request.image_url
                            }
                        }
                    ]
                }
            ],
            temperature=0.7,
            max_completion_tokens=150
        )

        description = completion.choices[0].message.content
        return {"description": description.strip()}

    except Exception as e:
        print(f"Vision error: {e}")
        return {"description": "Unable to analyze image. Please describe the item manually."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
