"use client";

import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";
import { Camera, CheckCircle, Sparkles, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { push, ref, set, get } from "firebase/database";
import { Item } from "@/components/item-card";
import { db } from "@/lib/firebase";
import { Dialog } from "@/components/dialog";

export default function ReportPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDescribing, setIsDescribing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [moderationResult, setModerationResult] = useState<{ approved: boolean; reason: string } | null>(null);
    const [imageModerationResult, setImageModerationResult] = useState<{ approved: boolean; reason: string } | null>(null);
    const [isModeratingImage, setIsModeratingImage] = useState(false);
    const [potentialMatches, setPotentialMatches] = useState<Item[]>([]);
    const [formData, setFormData] = useState({
        type: "LOST",
        title: "",
        category: "",
        date: "",
        location: "",
        description: "",
        image: null as string | null,
        imageUrl: null as string | null,  // Cloudinary URL
        highValue: false
    });

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
    };

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    const uploadToCloudinary = async (fileDataUrl: string) => {
        try {
            const formData = new FormData();
            formData.append("file", fileDataUrl);
            formData.append("upload_preset", "mrhs_lf"); // Using assumed preset

            const res = await fetch("https://api.cloudinary.com/v1_1/dgb28z8k8/image/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) return data.secure_url;
            throw new Error(data.error?.message || "Upload failed");
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const moderateContent = async (): Promise<boolean> => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/moderate-content`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (!data.approved) {
                    setModerationResult({ approved: false, reason: data.reason || "Content not allowed" });
                    return false;
                }
                return true;
            }
            // If API fails, allow submission (don't block users)
            return true;
        } catch (e) {
            console.error("Moderation error:", e);
            return true; // Fail open - don't block if API is down
        }
    };

    const moderateImage = async (imageUrl: string): Promise<boolean> => {
        try {
            setIsModeratingImage(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/moderate-image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: imageUrl })
            });

            if (res.ok) {
                const data = await res.json();
                if (!data.approved) {
                    setImageModerationResult({ approved: false, reason: data.reason || "Image not allowed" });
                    return false;
                }
                setImageModerationResult(null);
                return true;
            }
            // If API fails, allow submission (don't block users)
            return true;
        } catch (e) {
            console.error("Image moderation error:", e);
            return true; // Fail open - don't block if API is down
        } finally {
            setIsModeratingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        setModerationResult(null);
        setImageModerationResult(null);

        try {
            // Step 1: AI Content Moderation (text)
            const isTextApproved = await moderateContent();
            if (!isTextApproved) {
                setIsSubmitting(false);
                return; // Block submission
            }

            // Step 2: Upload image to Cloudinary if present
            let imageUrl = formData.imageUrl;
            if (formData.image && !formData.imageUrl) {
                setIsUploading(true);
                imageUrl = await uploadToCloudinary(formData.image);
                setIsUploading(false);

                if (imageUrl) {
                    setFormData(prev => ({ ...prev, imageUrl }));
                }
            }

            // Step 3: AI Image Moderation (if image was uploaded)
            if (imageUrl) {
                const isImageApproved = await moderateImage(imageUrl);
                if (!isImageApproved) {
                    setIsSubmitting(false);
                    return; // Block submission
                }
            }

            // Step 4: Submit to Firebase
            const newItemRef = push(ref(db, 'items'));
            const itemId = newItemRef.key;
            await set(newItemRef, {
                title: formData.title,
                category: formData.category,
                date: formData.date,
                location: formData.location,
                description: formData.description,
                type: formData.type,
                owner: user.uid,
                status: "PENDING",
                imageUrl: imageUrl || "",
                highValue: formData.highValue,
                createdAt: new Date().toISOString()
            });

            // Step 5: AI Value Evaluation (may auto-upgrade to high-value)
            try {
                const evalRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/evaluate-value`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: formData.title,
                        description: formData.description,
                        category: formData.category
                    })
                });
                if (evalRes.ok) {
                    const evalData = await evalRes.json();
                    if (evalData.highValue && !formData.highValue) {
                        const { update: fbUpdate } = await import("firebase/database");
                        await fbUpdate(ref(db, `items/${itemId}`), { highValue: true });
                    }
                }
            } catch (e) {
                console.error("Value evaluation error (non-blocking):", e);
            }

            // Find potential matches of opposite type
            try {
                const snapshot = await get(ref(db, "items"));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const oppositeType = formData.type === "LOST" ? "FOUND" : "LOST";
                    const candidates = Object.entries(data)
                        .map(([id, val]: [string, any]) => ({ id, ...val } as Item))
                        .filter((i) => i.type === oppositeType && i.status === "APPROVED" && i.category === formData.category);

                    const titleWords = formData.title.toLowerCase().split(/\s+/);
                    const descWords = formData.description.toLowerCase().split(/\s+/);
                    const words = [...titleWords, ...descWords].filter((w) => w.length > 3);

                    const scored = candidates
                        .map((c) => {
                            const text = (c.title + " " + c.description).toLowerCase();
                            const score = words.filter((w) => text.includes(w)).length;
                            return { item: c, score };
                        })
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3)
                        .map(({ item }) => item);

                    setPotentialMatches(scored);
                }
            } catch { /* non-critical */ }

            setStep(2);
        } catch (e) {
            console.error("Error submitting", e);
            showDialog("Submission Failed", "Failed to submit item. Please try again.", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAIDescribe = async () => {
        if (!formData.image) return;
        setIsDescribing(true);

        try {
            // First upload to get URL
            let imageUrl = formData.imageUrl;
            if (!imageUrl) {
                imageUrl = await uploadToCloudinary(formData.image);
                if (imageUrl) {
                    setFormData(prev => ({ ...prev, imageUrl }));
                }
            }

            if (!imageUrl) {
                showDialog("Upload Error", "Please try again - image upload needed for AI analysis.", "warning");
                setIsDescribing(false);
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/describe-image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: imageUrl })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.description && !data.description.includes("Unable")) {
                    setFormData(prev => ({ ...prev, description: data.description }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        description: "Please describe the item's color, brand, condition, and any identifying features."
                    }));
                }
            } else {
                showDialog("AI Analysis Failed", "AI couldn't analyze the image. Please describe manually.", "warning");
            }
        } catch (e) {
            console.error("AI Describe error:", e);
            showDialog("Service Unavailable", "AI service unavailable. Please describe manually.", "danger");
        } finally {
            setIsDescribing(false);
        }
    };

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-6 md:py-12">
                <div className="max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                {/* ... form content ... */}
                                <div className="mb-8 text-center">
                                    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-fbla-blue">Report an Item</h1>
                                </div>

                                {/* Text Moderation Result */}
                                {moderationResult && !moderationResult.approved && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                        <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-600">Content Not Allowed</p>
                                            <p className="text-sm text-red-500">{moderationResult.reason}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Image Moderation Result */}
                                {imageModerationResult && !imageModerationResult.approved && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                        <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-600">Image Not Allowed</p>
                                            <p className="text-sm text-red-500">{imageModerationResult.reason}</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-8 rounded-3xl border border-gray-200 shadow-xl">
                                    {/* ... form fields ... */}
                                    <div className="flex gap-4 p-1 bg-gray-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: "LOST" })}
                                            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${formData.type === "LOST" ? "bg-fbla-orange text-white shadow" : "text-gray-500 hover:text-fbla-orange"}`}
                                        >
                                            Lost Something
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: "FOUND" })}
                                            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${formData.type === "FOUND" ? "bg-fbla-blue text-white shadow" : "text-gray-500 hover:text-fbla-blue"}`}
                                        >
                                            Found Something
                                        </button>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Item Name</label>
                                            <input
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g., Red Water Bottle"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-fbla-blue focus:ring-1 focus:ring-fbla-blue transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Category</label>
                                            <select
                                                required
                                                value={formData.category}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 outline-none focus:border-fbla-blue focus:ring-1 focus:ring-fbla-blue transition-all"
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="">Select Category</option>
                                                <option>Electronics</option>
                                                <option>Clothing</option>
                                                <option>Books</option>
                                                <option>Personal Items</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-gray-700">Description</label>
                                            {formData.image && (
                                                <button
                                                    type="button"
                                                    onClick={handleAIDescribe}
                                                    disabled={isDescribing}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fbla-blue text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors"
                                                >
                                                    {isDescribing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    AI Describe
                                                </button>
                                            )}
                                        </div>
                                        <textarea
                                            required
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Provide details like color, brand, stickers, or unique markings..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-fbla-blue focus:ring-1 focus:ring-fbla-blue transition-all resize-none"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Date {formData.type === "LOST" ? "Lost" : "Found"}</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 outline-none focus:border-fbla-blue focus:ring-1 focus:ring-fbla-blue transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Location</label>
                                            <input
                                                required
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="e.g., Cafeteria"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-fbla-blue focus:ring-1 focus:ring-fbla-blue transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Upload Image</label>
                                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-fbla-blue transition-colors cursor-pointer group text-center bg-gray-50">
                                            <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            {formData.image ? (
                                                <div className="relative h-40 w-full">
                                                    <Image src={formData.image} alt="Preview" fill className="object-contain rounded-lg" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-fbla-blue transition-colors">
                                                    <Camera className="w-8 h-8 mb-2" />
                                                    <span>Click to upload photo</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* High Value Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-100 rounded-lg">
                                                <ShieldAlert className="w-5 h-5 text-yellow-700" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">High Value Item</p>
                                                <p className="text-xs text-gray-500">Toggle if this item is worth $50+ (e.g., AirPods, phone, laptop)</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, highValue: !prev.highValue }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${formData.highValue ? "bg-yellow-500" : "bg-gray-300"}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.highValue ? "translate-x-6" : ""}`} />
                                        </button>
                                    </div>

                                    {/* AI Safety Badge */}
                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                        <ShieldCheck className="w-4 h-4 text-green-600" />
                                        <span className="text-green-700 font-medium">Protected by AI text & image moderation</span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isUploading || isModeratingImage}
                                        className="w-full py-4 rounded-xl bg-fbla-orange text-white font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                                    >
                                        {isUploading ? "Uploading Image..." : isModeratingImage ? "Checking Image..." : isSubmitting ? "Checking & Submitting..." : "Submit Report"}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8 md:py-12 space-y-6 bg-white p-4 md:p-8 rounded-3xl border border-gray-200 shadow-xl"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                    <CheckCircle className="w-10 h-10" />
                                </div>

                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Report Submitted!</h2>
                                    <p className="text-gray-500">Your item has been sent for admin approval.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                    <Link href="/items">
                                        <button className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors border border-gray-200">
                                            View Gallery
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => { setStep(1); setFormData({ type: "LOST", title: "", category: "", date: "", location: "", description: "", image: null, imageUrl: null, highValue: false }); setModerationResult(null); setImageModerationResult(null); setPotentialMatches([]); }}
                                        className="px-6 py-3 rounded-xl bg-fbla-blue text-white font-bold hover:bg-blue-800 transition-colors"
                                    >
                                        Report Another
                                    </button>
                                </div>

                                {/* Potential Matches */}
                                {potentialMatches.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-200 text-left">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {formData.type === "LOST" ? "Could one of these be yours?" : "Someone may have lost this item"}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {formData.type === "LOST"
                                                ? "These found items are in the same category and may match your report."
                                                : "These lost reports may match the item you found."}
                                        </p>
                                        <div className="space-y-3">
                                            {potentialMatches.map((m) => (
                                                <Link key={m.id} href={`/items/${m.id}`} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-fbla-blue transition-colors">
                                                    {m.imageUrl ? (
                                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                            <Image src={m.imageUrl} alt={m.title} fill className="object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                            <Camera className="w-6 h-6 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-gray-900 truncate">{m.title}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{m.description}</p>
                                                        <p className="text-xs text-fbla-blue font-medium mt-1">{m.type} &middot; {m.category}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
