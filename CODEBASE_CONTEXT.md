# Marvin Ridge High School Lost & Found - Codebase Context

## Project Overview

This is a **Lost & Found web application** built for Marvin Ridge High School. It allows students and staff to report lost items, find found items, and manage the lost & found system through an admin dashboard. The application features AI-powered moderation, smart search, and image description capabilities.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.0 (React 19.2.3)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Database Client**: Firebase SDK (Realtime Database, Auth)
- **Image Hosting**: Cloudinary (client-side upload)
- **Other**: QR Code generation (`qrcode.react`)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **Image Storage**: Cloudinary
- **AI Services**:
  - Groq (Llama models for search & image description)
  - OpenAI (GPT-4o-mini for image moderation)

---

## Project Structure

```
/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                 # App router pages
│   │   │   ├── (auth)/          # Auth group (login, signup)
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── api/chat/route.ts   # Next.js API route for chatbot
│   │   │   ├── dashboard/page.tsx  # Admin/User dashboard
│   │   │   ├── items/              # Items browsing & detail
│   │   │   │   ├── page.tsx        # Browse all items
│   │   │   │   └── [id]/           # Dynamic item pages
│   │   │   │       ├── page.tsx    # Item detail
│   │   │   │       ├── claim/page.tsx   # Claim an item
│   │   │   │       └── inquiry/page.tsx # Send inquiry
│   │   │   ├── notifications/page.tsx   # User notifications
│   │   │   ├── report/page.tsx     # Report lost/found item
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Home page
│   │   │   └── globals.css         # Global styles & theme
│   │   ├── components/
│   │   │   ├── navbar.tsx          # Navigation + notifications
│   │   │   ├── footer.tsx          # Footer with school info
│   │   │   ├── item-card.tsx       # Item display card
│   │   │   ├── dialog.tsx          # Reusable modal dialog
│   │   │   ├── ai-chatbot.tsx      # FindBot chatbot widget
│   │   │   └── with-auth.tsx       # Auth HOC (unused)
│   │   ├── context/
│   │   │   └── auth-context.tsx    # Authentication context
│   │   └── lib/
│   │       ├── firebase.ts         # Firebase initialization
│   │       ├── utils.ts            # Utility functions (cn)
│   │       └── mock-data.ts        # Mock data (unused)
│   └── package.json
│
├── backend/                     # FastAPI backend (USE THIS, not backend-llama)
│   ├── main.py                  # Main API endpoints
│   ├── ai_config.py             # AI service configuration
│   ├── create_admin.py          # Script to create admin users
│   ├── seed_items.py            # Script to seed test data
│   ├── requirements.txt         # Python dependencies
│   └── Procfile                 # Heroku deployment config
│
└── backend-llama/               # IGNORE - alternative backend implementation
```

---

## Database Schema (Firebase Realtime Database)

### `/users/{uid}`
```json
{
  "username": "string",
  "role": "USER" | "ADMIN",
  "createdAt": "ISO timestamp"
}
```

### `/items/{itemId}`
```json
{
  "title": "string",
  "description": "string",
  "category": "Electronics" | "Clothing" | "Books" | "Personal Items" | "Other",
  "type": "LOST" | "FOUND",
  "location": "string (e.g., room number)",
  "date": "YYYY-MM-DD",
  "status": "PENDING" | "APPROVED" | "REJECTED" | "RESOLVED",
  "imageUrl": "string (Cloudinary URL)",
  "owner": "uid of creator",
  "createdAt": "ISO timestamp"
}
```

### `/inquiries/{inquiryId}`
```json
{
  "itemId": "string",
  "userId": "uid",
  "username": "string",
  "itemTitle": "string",
  "message": "string",
  "adminReply": "string | null",
  "status": "OPEN" | "RESOLVED",
  "read": "boolean",
  "createdAt": "ISO timestamp"
}
```

### `/claims/{claimId}`
```json
{
  "itemId": "string",
  "userId": "uid",
  "username": "string",
  "itemTitle": "string",
  "proof": "string (description of proof of ownership)",
  "status": "PENDING" | "APPROVED" | "REJECTED",
  "createdAt": "ISO timestamp"
}
```

---

## Features

### 1. User Authentication
- **Login/Signup**: Username-based auth (internally uses `username@lf.app` email)
- **Roles**: USER (default) and ADMIN
- **Context**: `AuthProvider` wraps the app, exposes `useAuth()` hook
- **Protected Routes**: All pages redirect to login if not authenticated

### 2. Item Reporting (`/report`)
- Report lost or found items
- Form fields: type, title, category, description, date, location, image
- **AI Features**:
  - "AI Describe" button: Uses Groq Vision (Llama 4 Scout) to auto-generate description from uploaded image
  - Content moderation: Text is checked by Groq AI before submission
  - Image moderation: Images checked by OpenAI GPT-4o-mini
- Items go to PENDING status for admin approval

### 3. Item Browsing (`/items`)
- Displays only APPROVED items
- Filter by type (ALL/LOST/FOUND)
- Filter by category
- **AI-Powered Search**:
  - Groq Llama 3.1 8B processes search queries
  - Corrects spelling errors
  - Shows "Showing results for X instead of Y" when corrected
  - Falls back to local search if AI fails

### 4. Item Details (`/items/[id]`)
- Full item information with image
- Two action buttons:
  - **Claim this Item** (only for FOUND items): Submit proof of ownership
  - **Ask Admin / Inquiry**: Send message to admin about the item

### 5. Admin Dashboard (`/dashboard`)
- **Tabs**:
  - Pending Approvals: Items awaiting approval (approve/reject)
  - All Items: Table view of all items with status management
  - Inquiries: View/reply to user inquiries
  - Claims: Approve/reject ownership claims
- **Stats**: Shows pending count and total items

### 6. User Dashboard (`/dashboard`)
- Shows user's own submitted items with their status

### 7. Notifications (`/notifications`)
- Shows user's inquiries and admin replies
- Bell icon in navbar shows unread count
- Marks as read when dropdown opened

### 8. AI Chatbot (FindBot)
- Floating chat widget (bottom-right)
- Helps users navigate the site
- Powered by backend `/api/chat` endpoint
- Has smart fallback responses when AI unavailable

---

## API Endpoints (Backend)

### Health & Status
- `GET /api/health` - Health check, returns AI status
- `GET /api/ai-status` - Check if AI features enabled

### Image Upload
- `POST /api/upload-image` - Upload base64 image to Cloudinary
  - Body: `{ image_base64: string }`
  - Returns: `{ url: string, public_id: string }`

### AI Moderation
- `POST /api/moderate-content` - Check text content
  - Body: `{ title, description, category }`
  - Returns: `{ approved: boolean, reason: string }`

- `POST /api/moderate-image` - Check image content (GPT-4o-mini)
  - Body: `{ image_url: string }`
  - Returns: `{ approved: boolean, reason: string }`

### AI Search
- `POST /api/ai-search` - Smart search with spell correction
  - Body: `{ query: string }`
  - Returns: `{ results: Item[], corrected_query: string }`

### AI Image Description
- `POST /api/describe-image` - Generate item description from image
  - Body: `{ image_url: string }`
  - Returns: `{ description: string }`

---

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_BACKEND_URL=
```

### Backend
```
FIREBASE_CREDENTIALS=  # JSON string of service account
GROQ_API_KEY=
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Key Components

### `auth-context.tsx`
- Provides `AuthProvider` and `useAuth()` hook
- Manages user state, role, login, signup, logout
- Maps username to `username@lf.app` for Firebase Auth

### `navbar.tsx`
- Responsive navigation with mobile menu
- Notification dropdown with unread count
- Shows "Admin Panel" link for admins

### `item-card.tsx`
- Reusable card for displaying items
- Shows image, title, description, location, date
- Admin sees Approve/Reject buttons for PENDING items
- Users see "View Details" button

### `dialog.tsx`
- Reusable modal component
- Supports: info, success, warning, danger types
- Can be confirm/alert style

### `ai-chatbot.tsx`
- FindBot floating chat widget
- Maintains conversation history
- Calls `/api/chat` for AI responses

---

## Styling & Theme

### Color Palette
```css
--color-fbla-orange: #EF7622;  /* Primary accent */
--color-fbla-blue: #003058;    /* Primary brand */
--color-fbla-cream: #F7F9F9;   /* Light backgrounds */
--color-mrhs-bg: #F5F5F5;      /* Secondary backgrounds */
```

### Tailwind Custom Classes
- `bg-fbla-orange`, `text-fbla-orange`
- `bg-fbla-blue`, `text-fbla-blue`
- `bg-fbla-cream`

---

## AI Models Used

| Feature | Model | Provider |
|---------|-------|----------|
| Image Description | `meta-llama/llama-4-scout-17b-16e-instruct` | Groq |
| Search & Text Moderation | `llama-3.1-8b-instant` | Groq |
| Image Moderation | `gpt-4o-mini` | OpenAI |

---

## Scripts

### Create Admin User
```bash
cd backend
python create_admin.py <username> <password>
```

### Seed Test Data
```bash
cd backend
python seed_items.py
```

---

## Deployment Notes

### Frontend
- Deploy to Vercel
- Set all `NEXT_PUBLIC_*` environment variables

### Backend
- Deploy to Heroku or similar
- Set `FIREBASE_CREDENTIALS` as JSON string
- `Procfile`: `web: uvicorn main:app --host=0.0.0.0 --port=$PORT`

---

## Important Implementation Details

### Authentication Flow
1. User enters username/password
2. Frontend converts to `username@lf.app` email
3. Firebase Auth handles authentication
4. Role fetched from `/users/{uid}` in Realtime Database
5. Default role is USER; admin must be set via `create_admin.py`

### Item Submission Flow
1. User fills form with optional image
2. If image: upload to Cloudinary first
3. Text moderation via `/api/moderate-content`
4. If image: moderation via `/api/moderate-image`
5. If all approved: save to Firebase with status=PENDING
6. Admin reviews in dashboard, approves/rejects

### Search Flow
1. User enters search query
2. Frontend calls `/api/ai-search`
3. Backend fetches all APPROVED items
4. Groq AI matches query to items + corrects spelling
5. Returns matching items and corrected query
6. Falls back to simple text search if AI fails

### Notification System
1. User sends inquiry on item detail page
2. Inquiry saved to `/inquiries` with status=OPEN
3. Admin sees in dashboard, can reply
4. User sees notifications in dropdown & notifications page
5. Marks as read when viewed

---

## Categories
- Electronics
- Clothing
- Books
- Personal Items
- Other

## Item Statuses
- `PENDING` - Awaiting admin approval
- `APPROVED` - Visible to all users
- `REJECTED` - Not shown (admin rejected)
- `RESOLVED` - Item was claimed successfully

---

## Notes for Development

1. **Firebase Rules**: Should restrict write access appropriately (see `firebase_rules.json`)
2. **AI Toggle**: Set `AI_ENABLED = False` in `ai_config.py` to disable AI features
3. **CORS**: Backend allows all origins (`*`) - restrict in production
4. **Image Uploads**: Cloudinary preset `mrhs_lf` must be configured
5. **Moderation Failsafe**: AI moderation fails open (allows submission if API fails)

---

## File Locations Quick Reference

| Feature | Frontend | Backend |
|---------|----------|---------|
| Home Page | `src/app/page.tsx` | - |
| Login | `src/app/(auth)/login/page.tsx` | - |
| Signup | `src/app/(auth)/signup/page.tsx` | - |
| Report Item | `src/app/report/page.tsx` | - |
| Browse Items | `src/app/items/page.tsx` | - |
| Item Detail | `src/app/items/[id]/page.tsx` | - |
| Claim Item | `src/app/items/[id]/claim/page.tsx` | - |
| Inquiry | `src/app/items/[id]/inquiry/page.tsx` | - |
| Dashboard | `src/app/dashboard/page.tsx` | - |
| Notifications | `src/app/notifications/page.tsx` | - |
| Auth Context | `src/context/auth-context.tsx` | - |
| Firebase Init | `src/lib/firebase.ts` | - |
| Main API | - | `main.py` |
| AI Config | - | `ai_config.py` |
