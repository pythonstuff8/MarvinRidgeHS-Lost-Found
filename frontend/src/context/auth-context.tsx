/**
 * Authentication Context
 * ──────────────────────
 * Provides app-wide authentication state using React Context + Firebase Auth.
 *
 * How it works:
 *   - Users sign up / log in with a USERNAME (not email). We internally map
 *     usernames to emails like "username@lf.app" for Firebase Auth compatibility.
 *   - On login, we fetch the user's role (ADMIN or USER) from Firebase Realtime
 *     Database at /users/{uid}/role. Admins have access to the admin dashboard.
 *   - The AuthProvider wraps the entire app (in layout.tsx), so any component
 *     can call useAuth() to get the current user, their role, and auth functions.
 *
 * Exported:
 *   - AuthProvider  → Wraps the app, provides auth state to all children
 *   - useAuth()     → Hook to access { user, role, loading, login, signup, logout }
 */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Two roles: ADMIN (full dashboard access) or USER (can report/claim items)
type UserRole = "ADMIN" | "USER";

// Shape of the context value available to all consuming components
type AuthContextType = {
    user: User | null;          // Firebase Auth user object (null if logged out)
    role: UserRole | null;      // "ADMIN" or "USER" (null if logged out)
    loading: boolean;           // True while checking auth state on page load
    login: (username: string, password: string) => Promise<void>;
    signup: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider — wraps the entire app to provide authentication state.
 * Listens for Firebase Auth state changes and fetches the user's role
 * from the Realtime Database whenever the auth state changes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Listen for auth state changes (login, logout, page refresh)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch the user's role from Firebase Realtime Database
                try {
                    const userRef = ref(db, `users/${currentUser.uid}`);
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        setRole(snapshot.val().role); // "ADMIN" or "USER"
                    } else {
                        setRole("USER"); // Default to USER if no record exists
                    }
                } catch (e) {
                    console.error("Error fetching role", e);
                    setRole("USER");
                }
            } else {
                setRole(null); // Logged out — no role
            }
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    /**
     * Login — maps username to a dummy email (username@lf.app) and
     * authenticates with Firebase Auth. Redirects to home on success.
     */
    const login = async (username: string, password: string) => {
        const email = `${username}@lf.app`;
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
    };

    /**
     * Signup — creates a new Firebase Auth account and saves the user's
     * profile (username, role, creation date) to the Realtime Database.
     * All new users default to USER role. Admin role is set manually.
     */
    const signup = async (username: string, password: string) => {
        const email = `${username}@lf.app`;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Default to USER role — admin must be promoted via database
        const assignedRole: UserRole = "USER";

        // Save user profile to Realtime Database under /users/{uid}
        await set(ref(db, `users/${uid}`), {
            username,
            role: assignedRole,
            createdAt: new Date().toISOString()
        });

        setRole(assignedRole);
        router.push("/");
    };

    /**
     * Logout — signs out of Firebase Auth and redirects to login page.
     */
    const logout = async () => {
        await signOut(auth);
        setRole(null);
        router.push("/login");
    };

    // Only render children after auth state has been determined (prevents flash)
    return (
        <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth — custom hook to access authentication state from any component.
 * Must be used within an AuthProvider (which wraps the entire app in layout.tsx).
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
