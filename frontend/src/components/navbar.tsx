"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Bell, LogOut, MessageSquare, ChevronRight, Search, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/auth-context";

import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";

// Notification Data Structure
type Notification = {
    id: string;
    itemTitle: string;
    message: string;
    adminReply?: string;
    status: "OPEN" | "REPLIED";
    read: boolean;
    createdAt: string;
};

/**
 * Navbar Component
 * 
 * Provides global navigation, user authentication status, and notification management.
 * Features:
 * - Responsive design with mobile menu overlay
 * - Real-time notification system using Firebase
 * - Role-based navigation links
 */
export function Navbar() {
    // UI state for menus
    const [isOpen, setIsOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Auth context
    const { user, logout, role } = useAuth();

    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => n.read === false).length;

    // Effect: Listen for notifications for the logged-in user
    useEffect(() => {
        if (user) {
            const inquiriesRef = ref(db, 'inquiries');
            const unsubscribe = onValue(inquiriesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const list = Object.entries(data)
                        .map(([id, val]: [string, any]) => ({ id, ...val }))
                        .filter((n: any) => n.userId === user.uid);
                    setNotifications(list.reverse()); // Show newest first
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Toggle notification dropdown and mark all as read automatically
    const handleToggleNotif = async () => {
        const nextState = !isNotifOpen;
        setIsNotifOpen(nextState);

        if (nextState && unreadCount > 0) {
            // Mark all as read
            const updates: { [key: string]: any } = {};
            notifications.forEach(n => {
                if (n.read === false) {
                    updates[`inquiries/${n.id}/read`] = true;
                }
            });
            await update(ref(db), updates);
        }
    };

    // Close notification dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col w-full font-sans sticky top-0 z-50 bg-white pt-safe">
            {/* Top Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-3 md:py-6 flex items-center justify-between gap-2 md:gap-4">
                    {/* Logo and School Info */}
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                        <Link href="/">
                            <img src="/MRHS_TRANSP.png" alt="MRHS" className="h-12 w-auto md:h-16 object-contain" />
                        </Link>
                        <div className="hidden md:block">
                            <h1 className="text-2xl md:text-3xl font-normal text-gray-900 leading-tight">
                                Marvin Ridge High School
                            </h1>
                            <p className="text-sm italic text-gray-600">Principal: Matt Lasher</p>
                        </div>
                        {/* Mobile Title - Simplified */}
                        <div className="block md:hidden truncate">
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">
                                MRHS Lost & Found
                            </h1>
                        </div>
                    </div>

                    {/* Quick Access / Utilities */}
                    <div className="flex items-center gap-3 md:gap-6 text-sm font-medium text-fbla-blue">


                        {/* Auth & Notifications Area styled plainly */}
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={handleToggleNotif}
                                    className="relative p-1.5 md:p-1 text-gray-600 hover:text-fbla-blue transition-colors"
                                >
                                    <Bell className="w-5 h-5 md:w-5 md:h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {/* Notification Dropdown */}
                                {isNotifOpen && (
                                    <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-hidden">
                                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                            <h3 className="font-bold text-gray-700">Notifications</h3>
                                            <Link href="/notifications" onClick={() => setIsNotifOpen(false)} className="text-xs text-fbla-blue hover:underline">
                                                View All
                                            </Link>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.slice(0, 5).map((notif) => (
                                                    <Link
                                                        key={notif.id}
                                                        href="/notifications"
                                                        onClick={() => setIsNotifOpen(false)}
                                                        className="block p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`p-2 rounded-full h-fit flex-shrink-0 ${notif.adminReply ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                                                                {notif.adminReply ? <MessageSquare className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                                    {notif.adminReply ? "New Reply" : "Inquiry Update"}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {notif.itemTitle}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-1">
                                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="p-6 text-center">
                                                    <p className="text-sm text-gray-500">No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Auth Buttons */}
                            <div className="hidden md:block">
                                {user ? (
                                    <button
                                        onClick={logout}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                                    >
                                        LOGOUT
                                    </button>
                                ) : (
                                    <Link href="/login" className="px-3 py-1 border border-gray-300 rounded text-xs uppercase tracking-wider text-gray-600 hover:bg-gray-50">
                                        LOGIN
                                    </Link>
                                )}
                            </div>


                            <Search className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 hidden md:block" />

                            {/* Mobile Menu Button - Moved to end */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-1.5 ml-1 text-gray-700 md:hidden"
                            >
                                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Navigation Strip */}
            <div className="bg-fbla-cream border-b border-gray-200 hidden md:block">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-12">
                        <div className="flex space-x-8 lg:space-x-12 mx-auto w-full justify-center">
                            <Link href="/" className="text-gray-700 font-bold hover:text-fbla-blue transition-colors px-2 relative group">
                                Home
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-fbla-blue transition-all group-hover:w-full"></span>
                            </Link>
                            <Link href="/items" className="text-gray-700 font-bold hover:text-fbla-blue transition-colors px-2 relative group">
                                Browse Items
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-fbla-blue transition-all group-hover:w-full"></span>
                            </Link>
                            <Link href="/report" className="text-gray-700 font-bold hover:text-fbla-blue transition-colors px-2 relative group">
                                Report Item
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-fbla-blue transition-all group-hover:w-full"></span>
                            </Link>
                            <Link href="/dashboard" className="text-gray-700 font-bold hover:text-fbla-blue transition-colors px-2 relative group">
                                {role === "ADMIN" ? "Admin Panel" : "Dashboard"}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-fbla-blue transition-all group-hover:w-full"></span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 absolute w-full left-0 top-full shadow-lg">
                    <div className="flex flex-col p-4 space-y-4">
                        <Link href="/" onClick={() => setIsOpen(false)} className="text-gray-800 font-medium py-2 border-b border-gray-100">Home</Link>
                        <Link href="/items" onClick={() => setIsOpen(false)} className="text-gray-800 font-medium py-2 border-b border-gray-100">Browse Items</Link>
                        <Link href="/report" onClick={() => setIsOpen(false)} className="text-gray-800 font-medium py-2 border-b border-gray-100">Report Item</Link>
                        <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-gray-800 font-medium py-2 border-b border-gray-100">Dashboard</Link>

                        {/* Mobile Auth Actions */}
                        <div className="pt-2 flex flex-col gap-3">
                            {user ? (
                                <button
                                    onClick={() => { logout(); setIsOpen(false); }}
                                    className="w-full py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-bold uppercase"
                                >
                                    Log Out
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="text-center py-2.5 border border-gray-300 rounded-lg text-sm font-bold uppercase text-gray-700">
                                        Log In
                                    </Link>
                                    <Link href="/signup" onClick={() => setIsOpen(false)} className="text-center py-2.5 bg-fbla-blue text-white rounded-lg text-sm font-bold uppercase">
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
