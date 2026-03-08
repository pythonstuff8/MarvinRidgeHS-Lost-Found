/**
 * Firebase Client Configuration
 * ─────────────────────────────
 * Initializes the Firebase SDK for the frontend. All credentials are
 * loaded from environment variables (NEXT_PUBLIC_FIREBASE_*) set in .env.local.
 *
 * Exports:
 *   - db      → Firebase Realtime Database (items, claims, inquiries, notifications)
 *   - auth    → Firebase Authentication (login, signup, session management)
 *   - storage → Firebase Storage (not actively used — images go through Cloudinary)
 *   - app     → The Firebase app instance
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase project configuration — values come from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Prevent re-initialization during Next.js hot reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services used throughout the app
const db = getDatabase(app);       // Realtime Database for all app data
const storage = getStorage(app);   // File storage (backup — Cloudinary is primary)
const auth = getAuth(app);         // Authentication for user login/signup

export { app, db, storage, auth };
