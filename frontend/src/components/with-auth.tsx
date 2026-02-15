"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withAuth(Component: any) {
    return function ProtectedRoute(props: any) {
        const { user, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading && !user) {
                router.push("/login");
            }
        }, [user, loading, router]);

        if (loading || !user) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-fbla-blue border-t-transparent rounded-full" />
                </div>
            );
        }

        return <Component {...props} />;
    };
}
