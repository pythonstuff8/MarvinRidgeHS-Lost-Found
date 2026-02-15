"use client";

import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Bell, MessageSquare } from "lucide-react";

type Notification = {
    id: string;
    itemTitle: string;
    message: string;
    adminReply?: string;
    status: "OPEN" | "REPLIED";
    createdAt: string;
};

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (user) {
            const inquiriesRef = ref(db, 'inquiries');
            onValue(inquiriesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const list = Object.entries(data)
                        .map(([id, val]: [string, any]) => ({ id, ...val }))
                        .filter((n: any) => n.userId === user.uid); // Only my inquiries
                    setNotifications(list.reverse()); // Newest first
                }
            });
        }
    }, [user]);

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-fbla-blue">
                    <Bell className="w-6 h-6 text-fbla-orange" />
                    Notifications
                </h1>

                <div className="space-y-4">
                    {notifications.length > 0 ? notifications.map((notif) => (
                        <div key={notif.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900">Inquiry about "{notif.itemTitle}"</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${notif.adminReply ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {notif.adminReply ? "Replied" : "Pending"}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-3 border border-gray-100">
                                <p>You asked: "{notif.message}"</p>
                            </div>

                            {notif.adminReply && (
                                <div className="flex gap-3 items-start">
                                    <div className="bg-blue-50 p-2 rounded-full border border-blue-100">
                                        <MessageSquare className="w-4 h-4 text-fbla-blue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-fbla-blue">Admin Reply</p>
                                        <p className="text-sm text-gray-800">{notif.adminReply}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-10">No notifications yet.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
