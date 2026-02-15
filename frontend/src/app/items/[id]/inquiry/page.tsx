"use client";

import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useParams } from "next/navigation";
import { push, ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Loader2, Send } from "lucide-react";
import { Dialog } from "@/components/dialog";

export default function InquiryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemTitle, setItemTitle] = useState("this item");

    // Dialog State
    const [dialogState, setDialogState] = useState<{ isOpen: boolean; title: string; message: string; type: "info" | "success" | "warning" | "danger" }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info"
    });

    const showDialog = (title: string, message: string, type: "info" | "success" | "warning" | "danger" = "info") => {
        setDialogState({ isOpen: true, title, message, type });
    };

    const closeDialog = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        // Redirect if it was a success message
        if (dialogState.type === "success") {
            router.push("/items/" + params.id);
        }
    };

    useEffect(() => {
        if (!loading && !user) router.push("/login");

        if (params.id) {
            get(ref(db, `items/${params.id}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    setItemTitle(snapshot.val().title);
                }
            });
        }
    }, [user, loading, router, params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !params.id) return;
        setIsSubmitting(true);

        try {
            const notifRef = push(ref(db, 'inquiries'));
            await set(notifRef, {
                itemId: params.id,
                userId: user.uid,
                username: user.email?.split('@')[0] || "User",
                itemTitle: itemTitle,
                message,
                adminReply: null,
                status: "OPEN",
                read: true, // User's own inquiry is "read" by them
                createdAt: new Date().toISOString()
            });
            showDialog("Inquiry Sent", "Inquiry sent to Admin! You will be notified when they reply.", "success");
        } catch (e) {
            showDialog("Error", "Failed to send inquiry", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
                <h1 className="text-2xl font-bold mb-4">Ask about "{itemTitle}"</h1>
                <p className="text-muted-foreground mb-6">Send a message to the admin regarding this item. You will be notified when they reply.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        placeholder="e.g., Is this item still available? Can I pick it up tomorrow?"
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-fbla-blue/20 outline-none h-40 resize-none"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-xl bg-fbla-blue text-white font-bold flex items-center justify-center gap-2 hover:bg-fbla-blue/90"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <> <Send className="w-4 h-4" /> Send Inquiry </>}
                    </button>
                </form>
            </main>

            <Dialog
                isOpen={dialogState.isOpen}
                onClose={closeDialog}
                title={dialogState.title}
                description={dialogState.message}
                type={dialogState.type}
            />
        </div>
    );
}
