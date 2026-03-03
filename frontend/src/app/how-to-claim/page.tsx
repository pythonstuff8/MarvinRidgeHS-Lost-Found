"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MousePointerClick,
  ClipboardCheck,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";

/**
 * How to Claim Page
 * Provides step-by-step instructions explaining how students and staff
 * can claim a lost item through the Lost & Found portal.
 */

const STEPS = [
  {
    number: 1,
    title: "Browse Items",
    description:
      "Head to the Items page and use the search bar or category filters to find your missing item. You can search by keywords, filter by category, or sort by most recent.",
    icon: Search,
  },
  {
    number: 2,
    title: "Identify Your Item",
    description:
      "Click on an item to view its full details — including photos, description, and the date it was found. Make sure it matches what you lost before proceeding.",
    icon: MousePointerClick,
  },
  {
    number: 3,
    title: "Submit a Claim",
    description:
      'Click the "Claim" button on the item detail page. You\'ll be asked to describe where you lost the item, provide a detailed description, and optionally upload proof of ownership such as receipts or photos.',
    icon: ClipboardCheck,
  },
  {
    number: 4,
    title: "Admin Review",
    description:
      "An administrator will review your claim and compare the information you provided against the actual item details. You will receive a notification once a decision is made.",
    icon: ShieldCheck,
  },
  {
    number: 5,
    title: "Pick Up Your Item",
    description:
      "Once your claim is approved, head to the front office to pick up your item. Bring your student ID for verification.",
    icon: PackageCheck,
  },
];

export default function HowToClaimPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if user is not authenticated (protected route)
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        {/* Page Header */}
        <div className="mb-8 border-b-2 border-fbla-blue pb-2 inline-block">
          <h1 className="text-3xl md:text-5xl font-bold text-fbla-blue">
            How to Claim an Item
          </h1>
        </div>

        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          Found something that belongs to you? Follow these steps to submit a
          claim and get your item back.
        </p>

        {/* Steps */}
        <div className="space-y-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex gap-5 items-start bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              {/* Step Number + Icon */}
              <div className="flex-shrink-0 w-14 h-14 bg-fbla-blue text-white rounded-lg flex flex-col items-center justify-center">
                <step.icon className="w-6 h-6" />
              </div>

              {/* Step Content */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  <span className="text-fbla-blue mr-1">
                    Step {step.number}:
                  </span>
                  {step.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/items">
            <button className="bg-fbla-blue hover:bg-blue-800 text-white font-bold py-3 px-8 rounded shadow-sm transition-colors uppercase tracking-wide">
              Browse Items
            </button>
          </Link>
          <Link href="/report">
            <button className="bg-fbla-orange hover:bg-orange-600 text-white font-bold py-3 px-8 rounded shadow-sm transition-colors uppercase tracking-wide">
              Report a Found Item
            </button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
