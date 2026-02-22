"use client";

import { Navbar } from "@/components/navbar";
import { Item } from "@/components/item-card";
import { MapPin, Calendar, Tag, ArrowLeft, Share2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ref, get, onValue, remove, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { Dialog } from "@/components/dialog";

export default function ItemDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [item, setItem] = useState<Item | null>(null);
    const [matches, setMatches] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [dialogState, setDialogState] = useState<{ isOpen: boolean; title: string; message: string; type: "info" | "success" | "warning" | "danger" }>({
        isOpen: false, title: "", message: "", type: "info"
    });

    const handleLowValueClaim = async () => {
        if (!user || !item) return;
        setClaiming(true);
        try {
            // Create notification with pickup location
            const notifRef = push(ref(db, "notifications"));
            await set(notifRef, {
                userId: user.uid,
                type: "ITEM_CLAIMED",
                title: "Item Claimed",
                message: `You claimed "${item.title}". Pick it up at ${item.location}.`,
                read: false,
                createdAt: new Date().toISOString(),
            });
            // Remove item from listings
            await remove(ref(db, `items/${item.id}`));
            setDialogState({
                isOpen: true,
                title: "Item Claimed!",
                message: `Pick it up at ${item.location}.`,
                type: "success"
            });
        } catch {
            setDialogState({
                isOpen: true,
                title: "Error",
                message: "Failed to claim item. Please try again.",
                type: "danger"
            });
        } finally {
            setClaiming(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            get(ref(db, `items/${params.id}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    setItem({ id: params.id as string, ...snapshot.val() });
                }
                setLoading(false);
            });
        }
    }, [params.id]);

    // Find potential matches of the opposite type
    useEffect(() => {
        if (!item) return;
        const itemsRef = ref(db, "items");
        const unsub = onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;
            const oppositeType = item.type === "LOST" ? "FOUND" : "LOST";
            const candidates = Object.entries(data)
                .map(([id, val]: [string, any]) => ({ id, ...val } as Item))
                .filter((i) => i.type === oppositeType && i.status === "APPROVED" && i.category === item.category);

            // Score by keyword overlap
            const titleWords = item.title.toLowerCase().split(/\s+/);
            const descWords = item.description.toLowerCase().split(/\s+/);
            const words = [...titleWords, ...descWords].filter((w) => w.length > 3);

            const scored = candidates
                .map((c) => {
                    const text = (c.title + " " + c.description).toLowerCase();
                    const score = words.filter((w) => text.includes(w)).length;
                    return { item: c, score };
                })
                .filter(({ score }) => score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(({ item }) => item);

            setMatches(scored);
        });
        return () => unsub();
    }, [item]);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    if (!item) {
        return <div className="p-10 text-center">Item not found</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8">
                <Link href="/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Gallery
                </Link>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Section */}
                    <div className="space-y-6">
                        <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-800">
                            {item.imageUrl ? (
                                <>
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className={cn("object-cover", item.highValue && "blur-xl")}
                                    />
                                    {item.highValue && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                                            <div className="text-center">
                                                <p className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-xl">
                                                    Image Blurred for Security
                                                </p>
                                                <p className="text-white/80 text-sm mt-1">
                                                    Submit a verified claim to view
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <Tag className="w-24 h-24 opacity-20" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-6">
                        {/* Badges */}
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded text-sm font-bold uppercase tracking-wide ${item.type === "LOST" ? "bg-fbla-orange text-white" : "bg-fbla-blue text-white"}`}>
                                {item.type}
                            </span>
                            <span className="text-sm text-gray-600 bg-gray-100 px-4 py-1.5 rounded font-medium border border-gray-200">
                                {item.category}
                            </span>
                            {item.highValue && (
                                <span className="px-3 py-1.5 rounded text-sm font-bold uppercase tracking-wide bg-yellow-400 text-yellow-900 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    High Value
                                </span>
                            )}
                        </div>

                        {/* Title & Description */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h1>
                            <p className="text-gray-600 leading-relaxed">
                                {item.description}
                            </p>
                        </div>

                        {/* Date & Location Notice */}
                        <div className="py-4 border-t border-b border-gray-200 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <Calendar className="w-5 h-5 text-fbla-blue" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Date</p>
                                    <p className="text-gray-900 font-medium">{item.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-fbla-orange/10 flex items-center justify-center border border-fbla-orange/20">
                                    <MapPin className="w-5 h-5 text-fbla-orange" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Location</p>
                                    {item.highValue ? (
                                        <p className="text-sm text-gray-500 italic">Shared with verified owners after claim approval</p>
                                    ) : (
                                        <p className="text-gray-900 font-medium">{item.location}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            {item.type === "FOUND" && (
                                item.highValue ? (
                                    <Link href={`/items/${item.id}/claim`} className="flex-1">
                                        <button className="w-full py-3 bg-fbla-orange text-white font-bold rounded hover:bg-orange-600 transition-colors">
                                            Claim this Item
                                        </button>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handleLowValueClaim}
                                        disabled={claiming || !user}
                                        className="flex-1 py-3 bg-fbla-orange text-white font-bold rounded hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {claiming ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</> : "Claim this Item"}
                                    </button>
                                )
                            )}
                            <Link href={`/items/${item.id}/inquiry`} className="flex-1">
                                <button className="w-full py-3 bg-fbla-blue text-white font-bold rounded hover:bg-blue-800 transition-colors">
                                    Ask Admin / Inquiry
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Potential Matches Section */}
                {matches.length > 0 && (
                    <div className="mt-12 border-t border-gray-200 pt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {item.type === "LOST" ? "Similar Found Items" : "Similar Lost Reports"}
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            {item.type === "LOST"
                                ? "These found items may be yours. If you recognize one, submit a claim."
                                : "Someone may have reported losing this item. Check if any of these match."}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matches.map((m) => (
                                <Link key={m.id} href={`/items/${m.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="relative h-36 w-full bg-gray-100">
                                        {m.imageUrl ? (
                                            <Image src={m.imageUrl} alt={m.title} fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-300">
                                                <Tag className="w-8 h-8 opacity-50" />
                                            </div>
                                        )}
                                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${m.type === "LOST" ? "bg-fbla-orange text-white" : "bg-fbla-blue text-white"}`}>
                                            {m.type}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{m.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{m.description}</p>
                                        <p className="text-xs text-fbla-blue font-medium mt-2">{m.category} &middot; {m.date}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Dialog
                isOpen={dialogState.isOpen}
                onClose={() => {
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                    if (dialogState.type === "success") router.push("/items");
                }}
                title={dialogState.title}
                description={dialogState.message}
                type={dialogState.type}
            />
        </div>
    );
}
