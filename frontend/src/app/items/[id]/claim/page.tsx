"use client";

import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useParams } from "next/navigation";
import { push, ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Loader2, ShieldCheck, ShieldAlert, Camera, X } from "lucide-react";
import { Dialog } from "@/components/dialog";
import Image from "next/image";

export default function ClaimPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [claimedLocation, setClaimedLocation] = useState("");
    const [claimedDescription, setClaimedDescription] = useState("");
    const [additionalProof, setAdditionalProof] = useState("");
    const [proofImages, setProofImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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

    const uploadToCloudinary = async (fileDataUrl: string): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append("file", fileDataUrl);
            formData.append("upload_preset", "mrhs_lf");

            const res = await fetch("https://api.cloudinary.com/v1_1/dgb28z8k8/image/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) return data.secure_url;
            throw new Error(data.error?.message || "Upload failed");
        } catch (e) {
            console.error("Cloudinary upload error:", e);
            return null;
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remaining = 3 - proofImages.length;
        const toProcess = Array.from(files).slice(0, remaining);

        toProcess.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofImages(prev => {
                    if (prev.length >= 3) return prev;
                    return [...prev, reader.result as string];
                });
            };
            reader.readAsDataURL(file);
        });

        // Reset input so re-selecting the same file works
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        setProofImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !params.id) return;
        setIsSubmitting(true);

        try {
            // Upload proof images to Cloudinary
            let proofImageUrls: string[] = [];
            if (proofImages.length > 0) {
                setIsUploading(true);
                const uploadPromises = proofImages.map(img => uploadToCloudinary(img));
                const results = await Promise.all(uploadPromises);
                proofImageUrls = results.filter((url): url is string => url !== null);
                setIsUploading(false);
            }

            const claimRef = push(ref(db, 'claims'));
            await set(claimRef, {
                itemId: params.id,
                userId: user.uid,
                username: user.email?.split('@')[0] || "User",
                itemTitle: itemTitle,
                claimedLocation,
                claimedDescription,
                additionalProof: additionalProof || null,
                proofImageUrls: proofImageUrls.length > 0 ? proofImageUrls : null,
                status: "PENDING",
                createdAt: new Date().toISOString()
            });

            showDialog("Claim Submitted", "Your claim has been submitted. An administrator will carefully review it and get back to you.", "success");
        } catch (e) {
            console.error("Claim submission error:", e);
            showDialog("Error", "Failed to submit claim request. Please try again.", "danger");
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
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

                    {/* Proof Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Upload proof images (optional, max 3)</label>
                        <p className="text-xs text-gray-500 ml-1">Photos of receipts, screenshots of purchase, photos of the item on your phone, etc.</p>

                        {proofImages.length > 0 && (
                            <div className="flex gap-3 flex-wrap">
                                {proofImages.map((img, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                        <Image src={img} alt={`Proof ${i + 1}`} fill className="object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {proofImages.length < 3 && (
                            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-fbla-orange transition-colors cursor-pointer group text-center bg-gray-50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-fbla-orange transition-colors">
                                    <Camera className="w-6 h-6 mb-1" />
                                    <span className="text-sm font-medium">Click to add photos ({proofImages.length}/3)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-fbla-orange/5 border border-fbla-orange/20 p-4 rounded-2xl">
                        <p className="text-xs text-fbla-orange leading-relaxed">
                            <strong>Note:</strong> False claims are subject to school disciplinary action. An administrator will review your claim and compare your answers against the actual item details.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        className="w-full py-4 rounded-2xl bg-fbla-orange text-white font-bold flex items-center justify-center gap-2 hover:bg-fbla-orange/90 transition-all shadow-lg shadow-fbla-orange/20 disabled:opacity-50"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Uploading Images...
                            </>
                        ) : isSubmitting ? (
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
