import os

# AI Configuration Toggle
AI_ENABLED = True

# OpenAI Configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Models - All OpenAI
TEXT_MODEL = "gpt-4.1-nano"          # Cheapest & fastest - text moderation, search
VISION_MODEL = "gpt-4.1-mini"       # Best cost/perf for vision - image description
IMAGE_MOD_MODEL = "gpt-4.1-nano"    # Cheapest with vision - image moderation (yes/no)

# Cloudinary Configuration (set via environment variables)
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
