"use client";

import { Navbar } from "@/components/navbar";
import { Item } from "@/components/item-card";
import { MapPin, Calendar, Tag, ArrowLeft, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

export default function ItemDetail() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState<Item | null>(null);
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

                        {/* Location & Date - Clean horizontal layout */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <MapPin className="w-5 h-5 text-fbla-orange" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Location</p>
                                    <p className="text-gray-900 font-medium">{item.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <Calendar className="w-5 h-5 text-fbla-blue" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Date</p>
                                    <p className="text-gray-900 font-medium">{item.date}</p>
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
            </main>
        </div>
    );
}
