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

type UserRole = "ADMIN" | "USER";

type AuthContextType = {
    user: User | null;
    role: UserRole | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    signup: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch role from DB
                // The username is stored in the email: username@fbla.local
                // But better to store additional user details in Realtime DB under /users/{uid}
                try {
                    const userRef = ref(db, `users/${currentUser.uid}`);
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        setRole(snapshot.val().role);
                    } else {
                        // Fallback or init
                        setRole("USER");
                    }
                } catch (e) {
                    console.error("Error fetching role", e);
                    setRole("USER");
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (username: string, password: string) => {
        // Map username to dummy email
        const email = `${username}@lf.app`;
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
    };

    const signup = async (username: string, password: string) => {
        const email = `${username}@lf.app`;
        // Check if username is taken? Firebase Auth handles email uniqueness.

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Default to USER role. Admin must be set via backend script.
        const assignedRole: UserRole = "USER";

        // Save user profile to Realtime DB
        await set(ref(db, `users/${uid}`), {
            username,
            role: assignedRole,
            createdAt: new Date().toISOString()
        });

        setRole(assignedRole);
        router.push("/");
    };

    const logout = async () => {
        await signOut(auth);
        setRole(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
