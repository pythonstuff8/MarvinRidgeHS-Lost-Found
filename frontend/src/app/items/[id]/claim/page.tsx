"use client";

import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useParams } from "next/navigation";
import { push, ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Dialog } from "@/components/dialog";

export default function ClaimPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [claimedLocation, setClaimedLocation] = useState("");
    const [claimedDescription, setClaimedDescription] = useState("");
    const [additionalProof, setAdditionalProof] = useState("");
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
        if (dialogState.type === "success" || dialogState.type === "warning" || dialogState.type === "info") {
            router.push("/items/" + params.id);
        }
    };

    useEffect(() => {
        if (!loading && !user) router.push("/login");

        if (params.id) {
            get(ref(db, `items/${params.id}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setItemTitle(data.title);
                    // Redirect low-value items back to detail page (they use one-click claim)
                    if (data.highValue !== true) {
                        router.push(`/items/${params.id}`);
                    }
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
                claimedLocation,
                claimedDescription,
                additionalProof: additionalProof || null,
                status: "PENDING",
                createdAt: new Date().toISOString()
            });

            showDialog("Claim Submitted", "Your claim has been submitted. An administrator will carefully review it and get back to you.", "success");
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
                        <h1 className="text-2xl font-bold text-gray-900">Claim &quot;{itemTitle}&quot;</h1>
                        <p className="text-muted-foreground text-sm text-gray-500">Submit proof of ownership to claim this item.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-fbla-blue/5 border border-fbla-blue/20 p-4 rounded-2xl">
                        <p className="text-xs text-fbla-blue leading-relaxed">
                            <strong>Verification:</strong> To confirm ownership, please answer the questions below. The item&apos;s location is hidden -- only the true owner would know where they lost it.
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-yellow-800">High Value Item — Admin Review</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                This is a high-value item. Your claim will be carefully reviewed by an administrator. Please provide accurate and detailed information.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Where did you lose this item?</label>
                        <input
                            type="text"
                            value={claimedLocation}
                            onChange={(e) => setClaimedLocation(e.target.value)}
                            required
                            placeholder="e.g., Cafeteria, Room F201, Library, Gym"
                            className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-fbla-orange/20 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Describe the item in detail</label>
                        <textarea
                            value={claimedDescription}
                            onChange={(e) => setClaimedDescription(e.target.value)}
                            required
                            placeholder="Color, brand, size, distinguishing marks, contents, scratches, stickers, etc."
                            className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-fbla-orange/20 outline-none h-32 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Additional proof (optional)</label>
                        <textarea
                            value={additionalProof}
                            onChange={(e) => setAdditionalProof(e.target.value)}
                            placeholder="Receipts, serial numbers, photos on your phone, or any other evidence of ownership."
                            className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-fbla-orange/20 outline-none h-24 resize-none"
                        />
                    </div>

                    <div className="bg-fbla-orange/5 border border-fbla-orange/20 p-4 rounded-2xl">
                        <p className="text-xs text-fbla-orange leading-relaxed">
                            <strong>Note:</strong> False claims are subject to school disciplinary action. An administrator will review your claim and compare your answers against the actual item details.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-2xl bg-fbla-orange text-white font-bold flex items-center justify-center gap-2 hover:bg-fbla-orange/90 transition-all shadow-lg shadow-fbla-orange/20 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            "Submit Claim Request"
                        )}
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
