"use client";

import { Navbar } from "@/components/navbar";
import { ItemCard, Item } from "@/components/item-card";
import { useState, useEffect } from "react";
import { Search, Filter, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function ItemsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [items, setItems] = useState<Item[]>([]);
    const [displayedItems, setDisplayedItems] = useState<Item[]>([]);
    const [filter, setFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
    const [isAISearching, setIsAISearching] = useState(false);
    const [correctedQuery, setCorrectedQuery] = useState("");

    useEffect(() => {
        if (!loading && !user) router.push("/login");

        if (user) {
            const itemsRef = ref(db, 'items');
            onValue(itemsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const itemList = Object.entries(data).map(([id, val]: [string, any]) => ({
                        id,
                        ...val
                    })).filter((item: Item) => item.status === "APPROVED");
                    setItems(itemList);
                    setDisplayedItems(itemList);
                } else {
                    setItems([]);
                    setDisplayedItems([]);
                }
            });
        }
    }, [user, loading, router]);

    // Handle search from URL params on mount
    useEffect(() => {
        const urlSearch = searchParams.get("search");
        const urlCategory = searchParams.get("category");

        if (urlSearch) {
            setSearch(urlSearch);
            performAISearch(urlSearch);
        }
        if (urlCategory) {
            setCategoryFilter(urlCategory);
        }
    }, [searchParams]);

    const performAISearch = async (query: string) => {
        if (!query.trim()) {
            setDisplayedItems(items);
            setCorrectedQuery("");
            return;
        }

        setIsAISearching(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai-search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    setDisplayedItems(data.results);
                    if (data.corrected_query !== query) {
                        setCorrectedQuery(data.corrected_query);
                    } else {
                        setCorrectedQuery("");
                    }
                } else {
                    // Fallback to local search
                    localSearch(query);
                }
            } else {
                localSearch(query);
            }
        } catch (e) {
            console.error("AI Search error:", e);
            localSearch(query);
        } finally {
            setIsAISearching(false);
        }
    };

    const localSearch = (query: string) => {
        const searchLower = query.toLowerCase();
        const results = items.filter((item) =>
            item.title.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower) ||
            item.location.toLowerCase().includes(searchLower) ||
            item.category.toLowerCase().includes(searchLower)
        );
        setDisplayedItems(results);
        setCorrectedQuery("");
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performAISearch(search);
    };

    // Apply type and category filters
    const filteredItems = displayedItems.filter((item) => {
        const matchesTypeFilter = filter === "ALL" || item.type === filter;
        const matchesCategory = !categoryFilter || item.category.toLowerCase() === categoryFilter.toLowerCase();
        return matchesTypeFilter && matchesCategory;
    });

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-fbla-blue">Browse Items</h1>
                        <p className="text-gray-500">View recently reported lost and found items.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-1 focus:ring-fbla-blue outline-none w-full sm:w-64"
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                            {(["ALL", "LOST", "FOUND"] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === type
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Spell Check Notice */}
                {correctedQuery && (
                    <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-purple-700 text-sm">
                        <Sparkles className="w-4 h-4" />
                        <p>
                            Showing results for <span className="font-bold">"{correctedQuery}"</span> instead of <span className="line-through opacity-70">"{search}"</span>
                        </p>
                    </div>
                )}

                {/* Grid */}
                {isAISearching ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <ItemCard key={item.id} item={item} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <p className="text-gray-400 text-lg">No items match your search.</p>
                                {categoryFilter && (
                                    <button
                                        onClick={() => setCategoryFilter("")}
                                        className="mt-4 px-4 py-2 rounded-xl bg-fbla-orange/10 text-fbla-orange text-sm font-bold border border-fbla-orange/20 hover:bg-fbla-orange/20"
                                    >
                                        Clear: {categoryFilter} ×
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div >
    );
}
