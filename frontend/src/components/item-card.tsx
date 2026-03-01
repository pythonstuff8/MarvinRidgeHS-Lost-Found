"use client";

import { motion } from "framer-motion";
import { Calendar, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { ref, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useState } from "react";
import { Dialog } from "@/components/dialog";

export type Item = {
    id: string;
    title: string;
    description: string;
    type: "LOST" | "FOUND";
    category: string;
    location: string;
    date: string;
    imageUrl?: string;
    status: "OPEN" | "RESOLVED" | "PENDING" | "APPROVED" | "REJECTED";
    owner?: string;
    highValue?: boolean;
};

export function ItemCard({ item, hideActions, isAdmin }: { item: Item; hideActions?: boolean; isAdmin?: boolean }) {
    const { role } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const handleStatusChange = async (newStatus: string) => {
        try {
            await update(ref(db, `items/${item.id}`), {
                status: newStatus
            });
        } catch (e) {
            setError("Failed to update status. Please try again.");
        }
    };

    return (
        <motion.div>
            {/* ... card content ... */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
                {/* ... existing card elements ... */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    {/* Status Badge */}
                    <div className={cn(
                        "absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold z-10 uppercase tracking-wide shadow-sm",
                        item.type === "LOST" ? "bg-fbla-orange text-white" : "bg-fbla-blue text-white"
                    )}>
                        {item.type}
                    </div>

                    {/* High Value Badge */}
                    {item.highValue && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold z-10 bg-yellow-400 text-yellow-900 shadow-sm flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            High Value
                        </div>
                    )}

                    {/* Placeholder or Image */}
                    {item.imageUrl ? (
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className={cn(
                                "object-cover transition-transform duration-500 group-hover:scale-110",
                                item.highValue && !isAdmin && "blur-lg"
                            )}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                            <Tag className="w-12 h-12 opacity-50" />
                        </div>
                    )}

                    {/* Blur overlay for high value (not shown to admins) */}
                    {item.highValue && item.imageUrl && !isAdmin && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-[5]">
                            <p className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
                                Image Protected
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 text-gray-900">{item.title}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {item.category}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                        {item.description}
                    </p>

                    <div className="pt-2 flex flex-col gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-fbla-blue" />
                            {item.date}
                        </div>
                    </div>

                    {hideActions ? null : role === "ADMIN" && item.status === "PENDING" ? (
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => handleStatusChange("APPROVED")}
                                className="flex-1 py-2 rounded-lg bg-green-500 text-white font-bold text-xs hover:bg-green-600 transition-colors"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleStatusChange("REJECTED")}
                                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    ) : (
                        <Link href={`/items/${item.id}`} className="block mt-4">
                            <button className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-fbla-blue hover:text-white transition-colors font-medium text-sm text-gray-700">
                                View Details
                            </button>
                        </Link>
                    )}
                </div>
            </motion.div>

            <Dialog
                isOpen={!!error}
                onClose={() => setError(null)}
                title="Error"
                description={error || ""}
                type="danger"
            />
        </motion.div>
    );
}
