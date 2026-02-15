"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Search, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Smartphone, Key, Book, Shirt } from "lucide-react";

// Categories available for browsing, mapped to icons and gradient colors
const CATEGORIES = [
  { name: "Electronics", icon: Smartphone },
  { name: "Clothing", icon: Shirt },
  { name: "Books", icon: Book },
  { name: "Personal Items", icon: Key },
  { name: "Other", icon: HelpCircle },
];

/**
 * Home Page Component
 * Displays the landing page with specific school information, quick actions,
 * a search bar, and sidebars for recent updates and help.
 */
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to login if user is not authenticated (protected route)
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/items?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/items");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {/* Page Title Section */}
        <div className="mb-8 border-b-2 border-fbla-blue pb-2 inline-block">
          <h1 className="text-3xl md:text-5xl font-bold text-fbla-blue">
            Lost & Found
          </h1>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Feature / Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="prose max-w-none text-gray-600">
              <p className="text-lg leading-relaxed">
                Welcome to the official Marvin Ridge High School Lost & Found portal.
                This platform is designed to help students and staff recover lost items
                and report found objects efficiently.
              </p>
              <p className="text-lg leading-relaxed mt-4">
                Stay up-to-date with the latest reported items! Browse our catalog
                to see if your missing belongings have been turned in, or submit a report
                if you have found something on campus.
              </p>
              <p className="text-lg leading-relaxed mt-4">
                Explore specific categories like Electronics, Clothing, and Books to fast-track your search.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/items">
                <button className="bg-fbla-blue hover:bg-blue-800 text-white font-bold py-3 px-8 rounded shadow-sm transition-colors uppercase tracking-wide">
                  VIEW ALL ITEMS
                </button>
              </Link>
              <Link href="/report">
                <button className="bg-fbla-blue hover:bg-blue-800 text-white font-bold py-3 px-8 rounded shadow-sm transition-colors uppercase tracking-wide">
                  REPORT ITEM
                </button>
              </Link>
            </div>

            {/* Search Bar Inline */}
            <div className="pt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Search</h3>
              <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by keywords..."
                  className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:border-fbla-blue bg-gray-50 text-gray-800"
                />
                <button
                  type="submit"
                  className="bg-fbla-orange hover:bg-orange-600 text-white font-bold py-3 px-6 rounded transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  SEARCH
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Sidebar / Calendar Style Info Cards */}
          <div className="space-y-6">
            {/* Sidebar Block 1: Recent Finds */}
            <div className="bg-mrhs-bg p-6 border-t-4 border-fbla-blue shadow-sm">
              <div className="flex gap-4">
                <div className="bg-fbla-blue text-white p-3 text-center min-w-[70px] h-fit">
                  <span className="block text-xs uppercase font-bold text-blue-100">ITEMS</span>
                  <span className="block text-2xl font-bold">New</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Recent Finds</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Check out the most recently turned in items.
                  </p>
                  <Link href="/items?sort=recent" className="text-fbla-blue font-bold text-sm hover:underline">
                    Read More
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar Block 2: How to Claim */}
            <div className="bg-mrhs-bg p-6 border-t-4 border-fbla-blue shadow-sm">
              <div className="flex gap-4">
                <div className="bg-fbla-blue text-white p-3 text-center min-w-[70px] h-fit">
                  <span className="block text-xs uppercase font-bold text-blue-100">INFO</span>
                  <span className="block text-2xl font-bold">Help</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">How to Claim</h3>
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>Identify your item</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>Submit a claim request</span>
                    </div>
                  </div>
                  <Link href="/report" className="text-fbla-blue font-bold text-sm hover:underline">
                    Read More
                  </Link>
                </div>
              </div>
            </div>
            {/* Categories Quick Links */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Browse Categories</h3>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/items?category=${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 border border-gray-200 group-hover:bg-fbla-blue group-hover:border-fbla-blue transition-colors">
                      <cat.icon className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-fbla-blue">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
