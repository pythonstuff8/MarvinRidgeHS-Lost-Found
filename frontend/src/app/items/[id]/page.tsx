"use client";

import { Navbar } from "@/components/navbar";
import { Item } from "@/components/item-card";
import { MapPin, Calendar, Tag, ArrowLeft, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function ItemDetail() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState<Item | null>(null);
    const [matches, setMatches] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

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
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
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
                                    <p className="text-sm text-gray-500 italic">Shared with verified owners after claim approval</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            {item.type === "FOUND" && (
                                <Link href={`/items/${item.id}/claim`} className="flex-1">
                                    <button className="w-full py-3 bg-fbla-orange text-white font-bold rounded hover:bg-orange-600 transition-colors">
                                        Claim this Item
                                    </button>
                                </Link>
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
        </div>
    );
}
