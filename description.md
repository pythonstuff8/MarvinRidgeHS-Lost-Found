# Marvin Ridge High School — Lost and Found System

## Project Description

A full-stack web application built for the **FBLA Website Coding and Development** competitive event. This system helps Marvin Ridge High School manage lost and found items digitally. Students can report items they have lost or found, browse submissions from others, and work with school administrators to reunite people with their belongings.

---

## The Problem

Schools deal with dozens of lost items every week. Traditional paper-based lost and found systems are slow, disorganized, and difficult to search. Students often never recover their belongings because there is no efficient way to check what has been turned in or to report what they have lost.

## Our Solution

This application provides students with a clean, searchable interface to report and recover items. It leverages **AI-powered moderation** to automatically screen submissions, **intelligent search** to correct spelling mistakes, and **automatic image descriptions** generated from uploaded photos — reducing the workload on school staff while making the system faster and more reliable for students.

---

## Features

### For Students
- **Report Items** — Submit a lost or found item with a title, description, category, location, date, and optional photo
- **Browse Catalog** — View all approved items with filters for type (lost/found) and category
- **AI-Powered Search** — Search using natural language with automatic spell correction
- **Claim Items** — Submit a claim on a found item with proof of ownership
- **Inquiries** — Send questions to administrators about a specific item
- **Notifications** — Receive updates when admins reply to inquiries or process claims

### For Administrators
- **Admin Dashboard** — View pending items awaiting review with system-wide statistics
- **Item Management** — Approve, reject, or delete submitted items
- **Claim Processing** — Review and process ownership claims
- **Inquiry Responses** — Respond directly to student inquiries

### AI Capabilities
- **Text Moderation** — All text submissions are screened by AI to flag inappropriate content (profanity, spam, personal info, dangerous items) before reaching an admin
- **Image Moderation** — Uploaded photos are checked by AI to ensure they are appropriate for a school environment
- **Intelligent Search** — AI handles typos, alternate phrasings, and fuzzy matching when students search for items
- **Auto Image Descriptions** — AI generates descriptive text from uploaded photos to assist students in filling out reports
- **AI Claim Review** — For low-value items, AI compares the claimant's answers against actual item data to verify ownership
- **Value Estimation** — AI determines whether an item is high-value ($50+) to route it for appropriate handling

---

## Tech Stack

| Layer            | Technology                                                  |
|------------------|-------------------------------------------------------------|
| **Frontend**     | Next.js, React, TypeScript, Tailwind CSS, Framer Motion     |
| **Backend**      | FastAPI (Python)                                            |
| **Database**     | Firebase Realtime Database                                  |
| **Authentication** | Firebase Auth (Email/Password)                           |
| **AI Models**    | OpenAI GPT-4.1-nano (text moderation, search, image moderation), GPT-4.1-mini (vision descriptions, claim review) |
| **Image Storage** | Cloudinary                                                 |

---

## Project Structure

```
MarvinRidgeHS-Lost-Found/
│
├── backend/                       # Python FastAPI server
│   ├── main.py                    # API server — all endpoints (moderation, search, claims, image upload)
│   ├── ai_config.py               # AI feature flags, model selection, API key config
│   ├── create_admin.py            # Script to create administrator accounts in Firebase
│   ├── seed_items.py              # Script to populate the database with sample data
│   ├── requirements.txt           # Python dependencies
│   └── .env.example               # Template for environment variables
│
├── frontend/                      # Next.js React application
│   ├── src/
│   │   ├── app/                   # Pages and routes
│   │   │   ├── page.tsx           # Home page — hero section, feature overview, claim process link
│   │   │   ├── report/page.tsx    # Report form — submit lost/found items with AI moderation
│   │   │   ├── items/page.tsx     # Item catalog — browse and filter all approved items
│   │   │   ├── items/[id]/page.tsx # Item detail — view item info, submit claims or inquiries
│   │   │   ├── dashboard/page.tsx # Admin/User dashboard — manage items, claims, and notifications
│   │   │   ├── how-to-claim/page.tsx # Claim instructions — step-by-step guide for students
│   │   │   ├── notifications/page.tsx # Notifications — view admin replies and claim updates
│   │   │   └── (auth)/            # Authentication pages (login, register)
│   │   ├── components/            # Reusable UI components
│   │   │   ├── navbar.tsx         # Navigation bar with responsive mobile menu
│   │   │   └── item-card.tsx      # Card component for displaying items in the catalog
│   │   ├── context/               # React context providers (authentication state)
│   │   └── lib/                   # Firebase client config and utility functions
│   ├── public/                    # Static assets (images, icons)
│   └── package.json               # Node.js dependencies
│
├── README.md                      # Project overview and setup instructions
└── description.md                 # This file — detailed project description
```

---

## How It Works

### 1. Account Creation
A student creates an account with a username and password. Authentication is handled through Firebase Auth behind the scenes.

### 2. Reporting an Item
The student fills out a form with item details (title, category, location, date, description) and optionally uploads a photo. When submitted:
- **Text Moderation**: The backend sends the title, category, and description to GPT-4.1-nano, which acts as a content moderator and flags inappropriate content (profanity, spam, personal info, dangerous items).
- **Image Upload**: If a photo is included, it is uploaded to Cloudinary and a secure URL is returned.
- **Image Moderation**: The image URL is sent to GPT-4.1-nano with vision capabilities, which checks whether the image is appropriate for a school environment.
- If both checks pass, the item is saved to Firebase with a **"pending"** status.

### 3. Admin Review
Administrators log into the dashboard to review pending items. They can approve, reject, or delete submissions. Approved items become visible in the public catalog for all students to browse.

### 4. Searching and Browsing
Students can browse the catalog using category and type filters. The AI-powered search endpoint uses GPT-4.1-nano to correct spelling errors and match items intelligently, falling back to simple text search if AI is unavailable.

### 5. Claiming an Item
When a student believes a found item is theirs, they submit a claim with:
- Where they lost it (location guess)
- A description of the item proving ownership
- Optional additional proof (serial numbers, receipts, etc.)

For low-value items, AI reviews the claim automatically by comparing the claimant's answers to the actual item data. High-value items are always routed to an administrator for manual review.

### 6. Notifications
Students receive notifications when:
- Their submitted item is approved or rejected
- An admin responds to their inquiry
- Their claim is processed
- A potential match is found between their lost report and a found item

---

## AI Moderation — Code Overview

### Text Moderation (`POST /api/moderate-content`)
Located in `backend/main.py` (lines 145–194). The endpoint receives the item's title, category, and description, sends them to GPT-4.1-nano with a system prompt instructing it to reject inappropriate content, and parses the AI's `APPROVED: true/false` response.

```python
# Text Moderation — checks submitted text for inappropriate content
@app.post("/api/moderate-content")
async def moderate_content(request: ModerationRequest):
    completion = openai_client.chat.completions.create(
        model="gpt-4.1-nano",  # Cheapest & fastest model
        messages=[
            {"role": "system", "content": "You are a content moderator for a high school lost and found..."},
            {"role": "user", "content": f"Title: {request.title}\nDescription: {request.description}"}
        ],
        temperature=0.1  # Low temperature for consistent moderation decisions
    )
    # Parse response: APPROVED: true/false, REASON: explanation
    return {"approved": approved, "reason": reason}
```

### Image Moderation (`POST /api/moderate-image`)
Located in `backend/main.py` (lines 197–261). The endpoint receives an image URL, sends it to GPT-4.1-nano with vision capabilities, and checks whether the image is appropriate for a school setting.

```python
# Image Moderation — checks uploaded photos for inappropriate content
@app.post("/api/moderate-image")
async def moderate_image(request: ImageModerationRequest):
    completion = openai_client.chat.completions.create(
        model="gpt-4.1-nano",  # Vision-capable model
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "Check if this image is appropriate..."},
                {"type": "image_url", "image_url": {"url": request.image_url}}
            ]
        }]
    )
    return {"approved": approved, "reason": reason}
```

### Frontend Integration
Located in `frontend/src/app/report/page.tsx`. The report form calls both moderation endpoints before saving an item:
- `moderateContent()` (line 75) — calls `/api/moderate-content`
- `moderateImage()` (line 103) — calls `/api/moderate-image`
- If either check fails, a red warning message is displayed to the student explaining why the submission was rejected.

---

## Report Item Form — Code Overview

Located in `frontend/src/app/report/page.tsx` (the `ReportPage` component, line 16).

The form is a multi-step wizard:
1. **Step 1** — Select item type: LOST or FOUND
2. **Step 2** — Fill in details: title, category, date, location, description, optional photo upload
3. **Step 3** — Success confirmation with potential matches displayed

The submission handler (`handleSubmit`, line 132) orchestrates the full flow:
1. Run AI text moderation on the title, category, and description
2. Upload the image to Cloudinary (if one was attached)
3. Run AI image moderation on the uploaded image URL
4. Save the item to Firebase Realtime Database with status "pending"
5. Check for potential matches (items in the same category of the opposite type)
6. Display the success screen with any matches found

---

## Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Firebase project with Realtime Database and Email/Password Auth enabled
- API keys for OpenAI and Cloudinary

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Copy .env.example to .env and fill in API keys
python main.py
```
The API runs at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### Frontend Setup
```bash
cd frontend
npm install
# Copy firebase.env.example to .env.local and fill in credentials
npm run dev
```
The app runs at `http://localhost:3000`.

### Create an Admin Account
```bash
cd backend
python create_admin.py <username> <password>
```

---

## Copyright

This project was created for the FBLA Website Coding and Development event. All rights reserved.
