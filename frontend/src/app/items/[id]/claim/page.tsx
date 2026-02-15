"use client";

import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useParams } from "next/navigation";
import { push, ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Loader2, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/dialog";

export default function ClaimPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [proof, setProof] = useState("");
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
            const claimRef = push(ref(db, 'claims'));
            await set(claimRef, {
                itemId: params.id,
                userId: user.uid,
                username: user.email?.split('@')[0] || "User",
                itemTitle: itemTitle,
                proof,
                status: "PENDING",
                createdAt: new Date().toISOString()
            });
            showDialog("Claim Submitted", "Claim request submitted! An admin will review it shortly.", "success");
        } catch (e) {
            showDialog("Error", "Failed to submit claim request", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-fbla-orange/10 rounded-2xl">
                        <ShieldCheck className="w-8 h-8 text-fbla-orange" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Claim "{itemTitle}"</h1>
                        <p className="text-muted-foreground text-sm text-gray-500">Submit proof of ownership to claim this item.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Proof of Ownership</label>
                        <textarea
                            value={proof}
                            onChange={(e) => setProof(e.target.value)}
                            required
                            placeholder="Please describe the item in detail (e.g., unique marks, contents, serial number) or provide any other proof that you are the owner."
                            className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-fbla-orange/20 outline-none h-48 resize-none"
                        />
                    </div>

                    <div className="bg-fbla-orange/5 border border-fbla-orange/20 p-4 rounded-2xl">
                        <p className="text-xs text-fbla-orange leading-relaxed">
                            <strong>Note:</strong> False claims are subject to school disciplinary action. Please ensure your description is as accurate as possible.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-2xl bg-fbla-orange text-white font-bold flex items-center justify-center gap-2 hover:bg-fbla-orange/90 transition-all shadow-lg shadow-fbla-orange/20 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Claim Request"}
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
