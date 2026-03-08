"""
Marvin Ridge Lost & Found — Backend API
========================================
This FastAPI server provides ALL backend endpoints for the Lost & Found
application. It handles:

  1. Image uploads          → Cloudinary CDN
  2. AI text moderation     → Screens submissions for inappropriate content
  3. AI image moderation    → Screens uploaded photos for inappropriate images
  4. AI value evaluation    → Determines if an item is high-value ($50+)
  5. AI claim verification  → Compares a claimant's answers to actual item data
  6. AI-powered search      → Spell-corrects queries and semantically matches items
  7. Image description      → Uses vision AI to auto-describe uploaded photos

Tech stack: FastAPI (Python), Firebase Realtime Database, OpenAI GPT-4.1,
            Cloudinary (image hosting).
"""

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

# Import AI configuration (model names, API keys, thresholds)
from ai_config import (
    AI_ENABLED, OPENAI_API_KEY,
    TEXT_MODEL, VISION_MODEL, IMAGE_MOD_MODEL,
    CLAIM_REVIEW_MODEL, VALUE_THRESHOLD,
    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
)

# ── Initialize FastAPI App ─────────────────────────────────────────
app = FastAPI(title="Marvin Ridge Lost & Found API")

# ── CORS Middleware ────────────────────────────────────────────────
# Allows the Next.js frontend (running on a different port/domain)
# to make requests to this backend API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Firebase Initialization ────────────────────────────────────────
# Firebase Realtime Database stores all items, claims, inquiries,
# notifications, and user data. We support two credential sources:
#   1. Environment variable (used in production/Render deployment)
#   2. Local JSON file (used during development)
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

# ── Initialize OpenAI Client ──────────────────────────────────────
# Only created if AI is enabled AND an API key is available.
openai_client = OpenAI(api_key=OPENAI_API_KEY) if AI_ENABLED and OPENAI_API_KEY else None

# ── Initialize Cloudinary ─────────────────────────────────────────
# Cloudinary is our image CDN — all user-uploaded photos are stored here
# and served via fast CDN URLs to the frontend.
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)


# ══════════════════════════════════════════════════════════════════
# REQUEST MODELS (Pydantic)
# These define the expected JSON body for each POST endpoint.
# ══════════════════════════════════════════════════════════════════

class DescribeRequest(BaseModel):
    image_url: str                    # Cloudinary URL of the uploaded image

class SearchRequest(BaseModel):
    query: str                        # User's search text (may contain typos)

class ImageUploadRequest(BaseModel):
    image_base64: str                 # Base64-encoded image data from the frontend

class ModerationRequest(BaseModel):
    title: str                        # Item title to moderate
    description: str                  # Item description to moderate
    category: str                     # Item category for context

class ImageModerationRequest(BaseModel):
    image_url: str                    # URL of the image to check

class ValueEvaluationRequest(BaseModel):
    title: str                        # Item title
    description: str                  # Item description
    category: str                     # Item category

class ClaimReviewRequest(BaseModel):
    item_id: str                      # Firebase key of the item being claimed
    claim_id: str                     # Firebase key of the claim submission


# ══════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════

# ── Health Check ───────────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    """Returns server status and which AI models are active.
    Used by the frontend to verify the backend is reachable."""
    return {
        "status": "healthy",
        "ai_enabled": AI_ENABLED and openai_client is not None,
        "service": "Marvin Ridge Lost & Found Backend",
        "text_model": TEXT_MODEL,
        "vision_model": VISION_MODEL
    }


# ── AI Status ─────────────────────────────────────────────────────
@app.get("/api/ai-status")
def ai_status():
    """Simple boolean check — is AI available? The frontend uses this
    to show/hide AI-powered features like 'AI Describe' button."""
    return {"ai_enabled": AI_ENABLED and openai_client is not None}


# ── Image Upload ──────────────────────────────────────────────────
@app.post("/api/upload-image")
async def upload_image(request: ImageUploadRequest):
    """Uploads a base64-encoded image to Cloudinary and returns its
    public URL. This URL is then stored in Firebase alongside the item.

    Flow: Frontend captures photo → converts to base64 → sends here →
          we upload to Cloudinary → return the CDN URL.
    """
    try:
        image_data = request.image_base64

        # Strip the data URL prefix (e.g., "data:image/jpeg;base64,") if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Generate a unique filename for the upload
        public_id = f"lostfound/{uuid.uuid4().hex[:12]}"

        # Upload to Cloudinary and get the result
        result = cloudinary.uploader.upload(
            f"data:image/jpeg;base64,{image_data}",
            public_id=public_id,
            folder="marvin_ridge_lf"
        )

        return {"url": result["secure_url"], "public_id": result["public_id"]}

    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


# ══════════════════════════════════════════════════════════════════
# AI-POWERED CONTENT MODERATION
# Screens user submissions for inappropriate content before they
# are stored in the database. Two separate checks:
#   1. Text moderation  — checks title + description
#   2. Image moderation — checks the uploaded photo
# ══════════════════════════════════════════════════════════════════

@app.post("/api/moderate-content")
async def moderate_content(request: ModerationRequest):
    """AI TEXT MODERATION — Uses GPT-4.1-nano to check if a submission's
    title, description, and category are appropriate for a school setting.

    Returns { approved: bool, reason: str }
    If the AI is disabled or errors out, we 'fail open' (allow the post)
    so that users aren't blocked by a service outage.
    """
    if not AI_ENABLED or not openai_client:
        return {"approved": True, "reason": "AI moderation disabled"}

    try:
        # Send the submission text to GPT for moderation
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
            temperature=0.1,            # Low temperature for consistent moderation
            max_completion_tokens=100    # Short response expected
        )

        output = completion.choices[0].message.content

        # Parse the structured response from the AI
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
        # Fail open — don't block users if the AI service is down
        return {"approved": True, "reason": "Moderation check skipped"}


@app.post("/api/moderate-image")
async def moderate_image(request: ImageModerationRequest):
    """AI IMAGE MODERATION — Uses GPT-4.1-nano with vision capability to
    check if an uploaded photo is appropriate for a school environment.

    The AI examines the image for nudity, violence, weapons, drugs,
    offensive content, and non-item images (memes, jokes, etc.).

    Returns { approved: bool, reason: str }
    """
    if not AI_ENABLED or not openai_client:
        return {"approved": True, "reason": "Image moderation disabled"}

    try:
        # Send the image URL to GPT's vision model for analysis
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

        # Parse the structured AI response
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


# ══════════════════════════════════════════════════════════════════
# AI VALUE EVALUATION
# Determines if an item is "high value" ($50+). High-value items
# get extra security: blurred images, hidden location, and require
# a verified claim process instead of one-click pickup.
# ══════════════════════════════════════════════════════════════════

@app.post("/api/evaluate-value")
async def evaluate_value(request: ValueEvaluationRequest):
    """AI VALUE EVALUATION — Uses GPT-4.1-nano to estimate whether an
    item is worth $50 or more in a high school context.

    Examples of high-value: AirPods, iPhones, laptops, graphing calculators
    Examples of low-value: water bottles, pens, notebooks, lanyards

    Returns { highValue: bool, reason: str }
    """
    if not AI_ENABLED or not openai_client:
        return {"highValue": False, "reason": "AI disabled, defaulting to low value"}

    try:
        completion = openai_client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a value estimator for a high school lost and found system.
Determine if an item is likely worth ${VALUE_THRESHOLD} or more.

HIGH VALUE examples: AirPods, iPhones, laptops, tablets, graphing calculators (TI-84/TI-Nspire),
smartwatches, Apple Watches, designer wallets, prescription glasses, car keys with fob,
MacBook chargers, Beats/Bose headphones, gaming devices, jewelry, class rings.

LOW VALUE examples: water bottles, pens, pencils, notebooks, spiral binders, umbrellas,
lanyards, hair ties, generic phone cables, erasers, folders, lunch containers, plastic rulers.

Respond ONLY in this format:
HIGH_VALUE: true or false
REASON: one sentence explanation"""
                },
                {
                    "role": "user",
                    "content": f"Title: {request.title}\nCategory: {request.category}\nDescription: {request.description}"
                }
            ],
            temperature=0.1,
            max_completion_tokens=80
        )

        output = completion.choices[0].message.content
        high_value = False
        reason = "Unable to determine"

        # Parse the structured AI response
        for line in output.split('\n'):
            if 'HIGH_VALUE:' in line.upper():
                high_value = 'true' in line.lower()
            elif 'REASON:' in line.upper():
                reason = line.split(':', 1)[1].strip() if ':' in line else reason

        return {"highValue": high_value, "reason": reason}

    except Exception as e:
        print(f"Value evaluation error: {e}")
        return {"highValue": False, "reason": "Evaluation failed, defaulting to low value"}


# ══════════════════════════════════════════════════════════════════
# AI CLAIM VERIFICATION
# This is the most complex AI feature. When a user claims an item,
# we compare their answers (guessed location, description, proof)
# against the ACTUAL item data stored in Firebase. The AI produces
# an approval decision, a confidence score (0-100), and a reason.
#
# If confidence >= 70 → auto-approve or auto-reject
# If confidence < 70  → flag for manual admin review
# ══════════════════════════════════════════════════════════════════

@app.post("/api/ai-review-claim")
async def ai_review_claim(request: ClaimReviewRequest):
    """AI CLAIM REVIEW — Fetches both the item and the claim from Firebase,
    then asks GPT-4.1-mini to compare the claimant's answers to the actual
    item details.

    The AI evaluates three factors:
      1. LOCATION MATCH — Did the claimant correctly guess where the item was?
      2. DESCRIPTION MATCH — Does their description match the real item?
      3. ADDITIONAL PROOF — Did they provide serial numbers, receipts, etc.?

    Returns { approved: bool, confidence: int, reason: str, needsAdminReview: bool }
    Also writes the AI review result back to the claim in Firebase.
    """
    if not AI_ENABLED or not openai_client:
        return {
            "approved": False,
            "reason": "AI disabled -- claim requires manual admin review",
            "confidence": 0,
            "needsAdminReview": True
        }

    try:
        # ── Step 1: Fetch the actual item data from Firebase ──
        item_ref = db.reference(f'items/{request.item_id}')
        item_data = item_ref.get()
        if not item_data:
            raise HTTPException(status_code=404, detail="Item not found")

        # ── Step 2: Fetch the claim submission from Firebase ──
        claim_ref = db.reference(f'claims/{request.claim_id}')
        claim_data = claim_ref.get()
        if not claim_data:
            raise HTTPException(status_code=404, detail="Claim not found")

        # Extract actual item details (ground truth)
        actual_location = item_data.get('location', 'Unknown')
        actual_description = item_data.get('description', '')
        actual_title = item_data.get('title', '')
        actual_category = item_data.get('category', '')

        # Extract claimant's answers (what the user submitted)
        claimed_location = claim_data.get('claimedLocation', '')
        claimed_description = claim_data.get('claimedDescription', '')
        additional_proof = claim_data.get('additionalProof', '')

        # ── Step 3: Send both to GPT for comparison ──
        completion = openai_client.chat.completions.create(
            model=CLAIM_REVIEW_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": """You are a claim verification assistant for a high school lost and found.
Compare the claimant's answers to the actual item data. Consider:

1. LOCATION MATCH: Does the claimed location match or is it very close to the actual location?
   - Exact match or same general area (e.g., "cafeteria" vs "lunch room") = strong match
   - Same building but different room = weak match
   - Completely different area = no match

2. DESCRIPTION MATCH: Does the claimant's description align with the actual item?
   - Mentions correct brand, color, distinguishing features = strong match
   - Generic description that could match many items = weak match
   - Contradicts actual item details = no match

3. ADDITIONAL PROOF: Any serial numbers, receipts, or specific knowledge that only an owner would know.

Respond ONLY in this exact format:
APPROVED: true or false
CONFIDENCE: number from 0 to 100
REASON: 1-2 sentence explanation of your decision

Guidelines:
- If confidence is below 60, set APPROVED to false regardless
- If location is completely wrong, set APPROVED to false
- Be strict -- false claims should not pass through"""
                },
                {
                    "role": "user",
                    "content": f"""ACTUAL ITEM DATA:
Title: {actual_title}
Category: {actual_category}
Location: {actual_location}
Description: {actual_description}

CLAIMANT'S ANSWERS:
Guessed Location: {claimed_location}
Item Description: {claimed_description}
Additional Proof: {additional_proof or 'None provided'}"""
                }
            ],
            temperature=0.2,            # Low temperature for consistent decisions
            max_completion_tokens=200
        )

        output = completion.choices[0].message.content

        # ── Step 4: Parse the structured AI response ──
        approved = False
        confidence = 0
        reason = "Unable to evaluate"

        for line in output.split('\n'):
            if 'APPROVED:' in line.upper():
                approved = 'true' in line.lower()
            elif 'CONFIDENCE:' in line.upper():
                try:
                    conf_str = line.split(':', 1)[1].strip()
                    confidence = int(''.join(c for c in conf_str if c.isdigit())[:3])
                except:
                    confidence = 0
            elif 'REASON:' in line.upper():
                reason = line.split(':', 1)[1].strip() if ':' in line else reason

        # Claims with confidence below 70 require manual admin review
        needs_admin = confidence < 70

        # ── Step 5: Write the AI review result back to Firebase ──
        import datetime
        claim_ref.update({
            'aiReview': {
                'approved': approved,
                'reason': reason,
                'confidence': confidence,
                'reviewedAt': datetime.datetime.now().isoformat()
            },
            # Update claim status based on AI decision:
            # - AI_APPROVED: confident approval → admin can fast-track
            # - AI_REJECTED: confident rejection → admin can confirm
            # - PENDING: low confidence → requires manual admin review
            'status': 'AI_APPROVED' if (approved and not needs_admin) else
                      'AI_REJECTED' if (not approved and not needs_admin) else 'PENDING'
        })

        return {
            "approved": approved,
            "reason": reason,
            "confidence": confidence,
            "needsAdminReview": needs_admin
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"AI claim review error: {e}")
        return {
            "approved": False,
            "reason": "AI review failed -- requires manual admin review",
            "confidence": 0,
            "needsAdminReview": True
        }


# ══════════════════════════════════════════════════════════════════
# AI-POWERED SEARCH
# Instead of simple text matching, we send the user's query and
# all items to GPT, which:
#   1. Corrects spelling errors (e.g., "airpods" → "AirPods")
#   2. Semantically matches items (understands "headphones" ≈ "earbuds")
# Falls back to simple text search if AI is unavailable.
# ══════════════════════════════════════════════════════════════════

@app.post("/api/ai-search")
async def ai_search(request: SearchRequest):
    """AI-POWERED SEARCH — Uses GPT-4.1-nano to understand user intent,
    correct typos, and match items semantically.

    For example, searching "iphon" will be corrected to "iPhone" and
    will match items containing "iPhone 15 with Cracked Screen."

    Returns { results: list[Item], corrected_query: str }
    """
    if not AI_ENABLED or not openai_client:
        return fallback_search(request.query)

    try:
        # ── Step 1: Load all approved items from Firebase ──
        items_ref = db.reference('items')
        items_data = items_ref.get()

        if not items_data:
            return {"results": [], "corrected_query": request.query}

        # Build a list of approved items for the AI to search through
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

        # ── Step 2: Format items as a compact text list for the AI ──
        items_context = "\n".join([
            f"ID:{i['id']} | {i['title']} | {i['category']} | {i['location']}"
            for i in items_list[:30]  # Limit to 30 items to stay within token limits
        ])

        # ── Step 3: Ask GPT to correct the query and find matches ──
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

        # ── Step 4: Parse the AI response ──
        corrected = request.query
        matching_ids = []

        for line in output.split('\n'):
            if line.startswith('CORRECTED:'):
                corrected = line.replace('CORRECTED:', '').strip()
            elif line.startswith('MATCHES:'):
                ids_str = line.replace('MATCHES:', '').strip()
                if ids_str.lower() != 'none':
                    matching_ids = [id.strip() for id in ids_str.split(',') if id.strip()]

        # Build result list from matching IDs
        results = [item for item in items_list if item['id'] in matching_ids]

        # ── Step 5: Fallback to simple text search if AI returned no matches ──
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
    """Simple text-based search used when AI is unavailable.
    Checks if the query string appears in any item's title or description."""
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


# ══════════════════════════════════════════════════════════════════
# AI IMAGE DESCRIPTION
# When a user uploads a photo, they can click "AI Describe" to have
# the vision model automatically generate a description of the item
# (color, brand, condition, identifying features).
# ══════════════════════════════════════════════════════════════════

@app.post("/api/describe-image")
async def describe_image(request: DescribeRequest):
    """AI IMAGE DESCRIPTION — Uses GPT-4.1-mini's vision capability to
    analyze an uploaded photo and generate a concise description of the
    lost/found item (color, brand, condition, identifying features).

    This saves users time when filling out the report form — they can
    upload a photo and let AI write the description for them.

    Returns { description: str }
    """
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


# ── Run the Server ─────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
