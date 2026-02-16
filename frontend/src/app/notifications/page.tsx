"use client";

import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Bell, CheckCircle, XCircle, MessageSquare, MapPin, Key, Search } from "lucide-react";

type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    pickupLocation?: string;
    pickupCode?: string;
    read: boolean;
    createdAt: string;
};

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (user) {
            const notifsRef = ref(db, 'notifications');
            onValue(notifsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const list = Object.entries(data)
                        .map(([id, val]: [string, any]) => ({ id, ...val }))
                        .filter((n: any) => n.userId === user.uid);
                    setNotifications(list.reverse());
                } else {
                    setNotifications([]);
                }
            });
        }
    }, [user]);

    if (loading || !user) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case "CLAIM_APPROVED": return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "CLAIM_REJECTED": return <XCircle className="w-5 h-5 text-red-500" />;
            case "ITEM_APPROVED": return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "ITEM_REJECTED": return <XCircle className="w-5 h-5 text-red-500" />;
            case "INQUIRY_REPLY": return <MessageSquare className="w-5 h-5 text-fbla-blue" />;
            case "MATCH_FOUND": return <Search className="w-5 h-5 text-fbla-orange" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getBorderColor = (type: string) => {
        if (type === "CLAIM_APPROVED") return "border-green-200";
        if (type === "CLAIM_REJECTED") return "border-red-200";
        if (type === "MATCH_FOUND") return "border-orange-200";
        return "border-gray-200";
    };

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
                        <div key={notif.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${getBorderColor(notif.type)}`}>
                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-gray-50 rounded-full border border-gray-100 flex-shrink-0">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900">{notif.title}</h3>
                                        <span className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{notif.message}</p>

                                    {notif.type === "CLAIM_APPROVED" && notif.pickupCode && (
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Key className="w-4 h-4 text-green-700" />
                                                <p className="text-sm font-bold text-green-800">Pickup Code</p>
                                            </div>
                                            <p className="text-2xl font-mono font-bold text-green-700 tracking-widest text-center py-2">{notif.pickupCode}</p>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-green-700" />
                                                <p className="text-sm text-green-800"><span className="font-bold">Pickup Location:</span> {notif.pickupLocation}</p>
                                            </div>
                                            <p className="text-xs text-green-600">Show this code to the administrator or front desk when picking up your item.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-10">No notifications yet.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
