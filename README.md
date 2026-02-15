# Lost and Found -- Marvin Ridge High School

A full-stack web application that helps Marvin Ridge High School manage lost and found items. Students report items they have lost or found, browse what others have submitted, and work with school administrators to reunite people with their belongings.

This project was built for the FBLA Website Coding and Development competitive event.

---

## The Problem

Schools deal with dozens of lost items every week. Paper-based lost and found systems are slow, disorganized, and hard to search. Students often never recover what they have lost because there is no easy way to check what has been turned in.

## Our Solution

This application gives students a clean, searchable interface to report and find items. It uses AI to moderate submissions automatically, correct search spelling mistakes, and generate descriptions from uploaded photos -- reducing the workload on school staff while making the system faster and more reliable for students.

---

## Features

**For students:**
- Report a lost or found item with a title, description, category, location, date, and optional photo
- Browse all approved items with filters for type (lost/found) and category
- Search using natural language with AI-powered spell correction
- Claim a found item by submitting proof of ownership
- Send an inquiry to administrators about a specific item
- View notifications for admin replies and claim updates

**For administrators:**
- Dashboard showing pending items awaiting review
- Approve, reject, or delete submitted items
- Review and process item claims
- Respond to student inquiries
- View system-wide statistics

**AI capabilities:**
- Text moderation on all submissions (flags inappropriate content before it reaches an admin)
- Image moderation on uploaded photos
- Intelligent search that handles typos and alternate phrasings
- Automatic image descriptions generated from uploaded photos

---

## Tech Stack

| Layer          | Technology                                                     |
|----------------|----------------------------------------------------------------|
| Frontend       | Next.js, React, TypeScript, Tailwind CSS, Framer Motion       |
| Backend        | FastAPI (Python)                                               |
| Database       | Firebase Realtime Database                                     |
| Authentication | Firebase Auth                                                  |
| AI / ML        | Groq (Llama 3.1, Llama 4 Scout), OpenAI (GPT-4o-mini)        |
| Image Storage  | Cloudinary                                                     |

---

## Project Structure

```
backend/
  main.py              API server entry point
  ai_config.py         AI feature flags and model configuration
  create_admin.py      Script to create administrator accounts
  seed_items.py        Script to populate the database with sample data
  requirements.txt     Python dependencies
  .env.example         Template for environment variables

frontend/
  src/
    app/               Next.js pages and routes
    components/        Reusable UI components (navbar, item cards, dialogs, chatbot)
    context/           React context providers (authentication)
    lib/               Firebase client config, utilities
  public/              Static assets
  package.json         Node.js dependencies
```

---

## How It Works

1. A student creates an account with a username and password. The system handles authentication through Firebase behind the scenes.

2. To report an item, the student fills out a form with details and optionally uploads a photo. The backend runs the text through an AI moderation check (Groq Llama 3.1) and, if a photo is included, checks the image as well (OpenAI GPT-4o-mini). If the content passes moderation, the item is saved with a "pending" status.

3. An administrator reviews pending items in the dashboard and either approves or rejects them. Approved items become visible in the public catalog.

4. Other students can browse the catalog, use AI-assisted search to find specific items, submit a claim with proof of ownership, or send an inquiry to an admin.

5. Administrators manage claims and respond to inquiries. Students receive notifications when there are updates.

---

## Setup and Installation

### Prerequisites

- Python 3.10 or later
- Node.js 18 or later
- A Firebase project with Realtime Database and Email/Password Authentication enabled
- API keys for Groq, OpenAI, and Cloudinary

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your API keys and Firebase service account credentials.

Start the server:

```bash
python main.py
```

The API will be available at `http://localhost:8000`. FastAPI's built-in documentation is at `http://localhost:8000/docs`.

To create an admin account:

```bash
python create_admin.py <username> <password>
```

### Frontend

```bash
cd frontend
npm install
```

Copy `firebase.env.example` to `.env.local` and fill in your Firebase project credentials. Set `NEXT_PUBLIC_BACKEND_URL` to point to your backend (defaults to `http://localhost:8000`).

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Copyright

This project was created for the FBLA Website Coding and Development event. All rights reserved.
