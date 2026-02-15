import os

# AI Configuration Toggle
# Set to True to enable AI features, False to disable
AI_ENABLED = True

# API Keys (set via environment variables)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Models
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # For image description
SEARCH_MODEL = "llama-3.1-8b-instant"  # For AI search
OPENAI_VISION_MODEL = "gpt-4o-mini"  # For image moderation (cost-effective)

# Cloudinary Configuration (set via environment variables)
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
