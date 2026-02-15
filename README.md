# Lost and Found -- Marvin Ridge High School

A web application for managing lost and found items at Marvin Ridge High School. Students and staff can report lost or found items, browse submissions, claim items, and communicate with administrators. The system includes AI-powered content moderation and intelligent search.

Built for the FBLA Website Coding and Development event.

## Features

- Report lost or found items with optional image upload
- Browse and search the item catalog with AI-assisted spell correction
- Claim found items with proof of ownership
- Send inquiries to administrators about specific items
- Admin dashboard for reviewing submissions, managing claims, and responding to inquiries
- Automatic content moderation (text and images) using AI
- Auto-generated image descriptions

## Tech Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, Firebase SDK, Framer Motion

**Backend:** FastAPI, Python, Firebase Admin SDK, Groq (Llama), OpenAI (GPT-4o-mini), Cloudinary

**Database:** Firebase Realtime Database

**Authentication:** Firebase Auth (email/password, abstracted behind usernames)

## Project Structure

```
backend/          Python FastAPI server (AI moderation, search, image processing)
frontend/         Next.js web application
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Firebase project with Realtime Database and Authentication enabled
- Groq API key (for search and text moderation)
- OpenAI API key (for image moderation)
- Cloudinary account (for image uploads)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your credentials. Alternatively, set the environment variables directly.

To start the server:

```bash
python main.py
```

The API runs on `http://localhost:8000`. Interactive docs are available at `http://localhost:8000/docs`.

To create an admin user:

```bash
python create_admin.py <username> <password>
```

### Frontend

```bash
cd frontend
npm install
```

Copy `firebase.env.example` to `.env.local` and fill in your Firebase project credentials, along with `NEXT_PUBLIC_BACKEND_URL` pointing to your backend (default: `http://localhost:8000`).

To start the development server:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## How It Works

1. Users sign up with a username and password. The frontend converts usernames to email addresses internally for Firebase Auth.
2. Reported items go through AI moderation (text via Groq, images via OpenAI) before being submitted with a "pending" status.
3. Admins review pending items in the dashboard and approve or reject them.
4. Approved items appear in the public catalog, where users can search, filter, submit claims, or send inquiries.
5. Admins manage claims and respond to inquiries through the dashboard.

## License

This project was built for the FBLA Website Coding and Development competitive event.
