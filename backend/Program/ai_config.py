"""
AI Configuration File
---------------------
Centralizes all AI model settings and external service credentials.
This file is imported by main.py so that model names, API keys, and
thresholds can be changed in one place without touching endpoint logic.
"""

import os

# ── Master Toggle ──────────────────────────────────────────────────
# Set to False to disable ALL AI features (moderation, search, etc.)
AI_ENABLED = True

# ── OpenAI API Key ─────────────────────────────────────────────────
# Loaded from the OPENAI_API_KEY environment variable at deploy time.
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# ── Model Selection ────────────────────────────────────────────────
# We use different OpenAI models for different tasks to balance cost
# and capability:
TEXT_MODEL = "gpt-4.1-nano"          # Cheapest & fastest — text moderation, search
VISION_MODEL = "gpt-4.1-mini"       # Best cost/performance for vision — image descriptions
IMAGE_MOD_MODEL = "gpt-4.1-nano"    # Cheapest model with vision — image moderation (yes/no)
CLAIM_REVIEW_MODEL = "gpt-4.1-mini" # Better reasoning needed for claim verification

# ── Value Threshold ────────────────────────────────────────────────
# Items estimated above this dollar amount are flagged as "high value."
# High-value items require a verified claim (with admin review) instead
# of one-click pickup, and their images/locations are blurred for security.
VALUE_THRESHOLD = 50

# ── Cloudinary Configuration ───────────────────────────────────────
# Cloudinary is used for image hosting (user-uploaded item photos).
# Credentials are loaded from environment variables at deploy time.
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
