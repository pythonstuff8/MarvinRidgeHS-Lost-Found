"use client";

import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Item, ItemCard } from "@/components/item-card";
import { LayoutDashboard, Trash2, CheckCircle, Send } from "lucide-react";
import { ref, remove, update, onValue, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { Dialog } from "@/components/dialog";

// Inquiry Type Definition: Represents a message from a user about an item
type Inquiry = {
    id: string;
    userId: string;
    username: string;
    itemTitle: string;
    status: "OPEN" | "RESOLVED";
    message: string;
    adminReply?: string;
    itemId: string;
};

// Claim Type Definition: Represents a formal claim request for an item
type Claim = {
    id: string;
    username: string;
    userId: string;
    itemTitle: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    claimedLocation: string;
    claimedDescription: string;
    additionalProof?: string;
    proof?: string; // legacy field
    itemId: string;
};

/**
 * Dashboard Component
 * 
 * Serves as the main hub for both regular users and administrators.
 * - Users: Can view the items they have reported.
 * - Admins: Have access to a comprehensive dashboard to:
 *   - View system statistics
 *   - Manage all reported items (approve/delete)
 *   - Respond to inquiries
 *   - Process claim requests
 */
export default function Dashboard() {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [myItems, setMyItems] = useState<Item[]>([]);
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [activeTab, setActiveTab] = useState<"pending" | "all" | "inquiries" | "claims">("pending");
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

    // Modal State
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [stats, setStats] = useState([
        { label: "Pending Approvals", value: "0" },
        { label: "Total Items", value: "0" },
    ]);

    // Data Fetching and Real-time Subscriptions
    useEffect(() => {
        if (!user) return;

        // 1. Fetch Items from Firebase Realtime Database
        const itemsRef = ref(db, 'items');
        const unsubItems = onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            const itemsList = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
            setAllItems(itemsList as Item[]);
            // Filter items that belong to the current user
            setMyItems(itemsList.filter((i: Item) => i.owner === user.uid) as Item[]);

            // Update stats if user is an admin
            if (role === 'ADMIN') {
                const pendingCount = itemsList.filter((i: Item) => i.status === 'PENDING').length;
                setStats(prev => [
                    { ...prev[0], value: pendingCount.toString() },
                    { label: "Total Items", value: itemsList.length.toString() },
                ]);
            }
        });

        // 2. Fetch Inquiries (Admin only)
        let unsubInquiries = () => { };
        if (role === 'ADMIN') {
            const inqRef = ref(db, 'inquiries');
            unsubInquiries = onValue(inqRef, (snapshot) => {
                const data = snapshot.val();
                const inqList = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
                setInquiries(inqList as Inquiry[]);
            });
        }

        // 3. Fetch Claims (Admin only)
        let unsubClaims = () => { };
        if (role === 'ADMIN') {
            const claimsRef = ref(db, 'claims');
            unsubClaims = onValue(claimsRef, (snapshot) => {
                const data = snapshot.val();
                const claimsList = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
                setClaims(claimsList as Claim[]);
            });
        }

        // Cleanup listeners on component unmount
        return () => {
            unsubItems();
            unsubInquiries();
            unsubClaims();
        };
    }, [user, role]);

    // Handler to open delete confirmation modal
    const handleDelete = (itemId: string) => {
        setItemToDelete(itemId);
        setIsDeleteDialogOpen(true);
    };

    // Handler to proceed with item deletion
    const confirmDelete = async () => {
        if (itemToDelete) {
            await remove(ref(db, `items/${itemToDelete}`));
            setItemToDelete(null);
            setIsDeleteDialogOpen(false);
        }
    };

    // Helper to generate a random pickup code
    const generatePickupCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    };

    // Helper to create a notification
    const createNotification = async (data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        pickupLocation?: string;
        pickupCode?: string;
    }) => {
        const notifRef = push(ref(db, "notifications"));
        await set(notifRef, {
            ...data,
            read: false,
            createdAt: new Date().toISOString(),
        });
    };

    // Update item status (e.g., approve a pending item) and notify owner
    const handleStatus = async (itemId: string, status: string) => {
        const item = allItems.find((i) => i.id === itemId);
        await update(ref(db, `items/${itemId}`), { status });
        if (item && item.owner && item.owner !== "seed_script") {
            if (status === "APPROVED") {
                await createNotification({
                    userId: item.owner,
                    type: "ITEM_APPROVED",
                    title: "Item Approved",
                    message: `Your report "${item.title}" has been approved and is now visible to other students.`,
                });
            } else if (status === "REJECTED") {
                await createNotification({
                    userId: item.owner,
                    type: "ITEM_REJECTED",
                    title: "Item Rejected",
                    message: `Your report "${item.title}" was not approved. Please contact an administrator if you have questions.`,
                });
            }
        }
    };

    // Send a reply to an inquiry and notify the user
    const handleReply = async (inquiryId: string) => {
        const reply = replyText[inquiryId];
        if (!reply) return;

        try {
            const inquiry = inquiries.find((i) => i.id === inquiryId);
            await update(ref(db, `inquiries/${inquiryId}`), {
                adminReply: reply,
                status: "RESOLVED"
            });
            if (inquiry) {
                await createNotification({
                    userId: inquiry.userId,
                    type: "INQUIRY_REPLY",
                    title: "Admin Reply",
                    message: `An admin replied to your inquiry about "${inquiry.itemTitle}": "${reply}"`,
                });
            }
            setReplyText(prev => {
                const next = { ...prev };
                delete next[inquiryId];
                return next;
            });
        } catch (e) {
            alert("Failed to send reply");
        }
    };

    // Update claim status, notify claimant, and handle item lifecycle
    const handleClaimStatus = async (claimId: string, itemId: string, newStatus: string) => {
        try {
            const claim = claims.find((c) => c.id === claimId);
            const item = allItems.find((i) => i.id === itemId);

            await update(ref(db, `claims/${claimId}`), { status: newStatus });

            if (newStatus === "APPROVED" && claim && item) {
                const pickupCode = generatePickupCode();
                await createNotification({
                    userId: claim.userId,
                    type: "CLAIM_APPROVED",
                    title: "Claim Approved",
                    message: `Your claim for "${claim.itemTitle}" has been approved. Show your pickup code to collect the item.`,
                    pickupLocation: item.location,
                    pickupCode,
                });
                // Remove item from public listings
                await remove(ref(db, `items/${itemId}`));
            } else if (newStatus === "REJECTED" && claim) {
                await createNotification({
                    userId: claim.userId,
                    type: "CLAIM_REJECTED",
                    title: "Claim Not Approved",
                    message: `Your claim for "${claim.itemTitle}" was not approved. The information provided did not match the item details.`,
                });
            }
        } catch (e) {
            alert("Failed to update claim status");
        }
    };

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 border-b border-gray-200 pb-4 gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-fbla-blue">
                        {role === "ADMIN" ? "Admin Dashboard" : "User Dashboard"}
                    </h1>
                </div>

                {/* Statistics Overview (Admin Only) */}
                {role === "ADMIN" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
                        {stats.map((stat) => (
                            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-sm text-gray-500 font-bold">{stat.label}</p>
                                    <p className="text-3xl md:text-4xl font-bold mt-1 text-gray-900">{stat.value}</p>
                                </div>
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <LayoutDashboard className="w-6 h-6 md:w-7 md:h-7 text-fbla-blue" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Dashboard Tabs (Admin Only) - Scrollable on mobile */}
                {role === "ADMIN" && (
                    <div className="mb-6 md:mb-8 flex gap-4 border-b border-gray-200 pb-1 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`pb-3 px-1 font-bold whitespace-nowrap transition-colors text-sm md:text-base ${activeTab === "pending" ? "text-fbla-orange border-b-2 border-fbla-orange" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Pending Approvals
                        </button>
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`pb-3 px-1 font-bold whitespace-nowrap transition-colors text-sm md:text-base ${activeTab === "all" ? "text-fbla-orange border-b-2 border-fbla-orange" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            All Items
                        </button>
                        <button
                            onClick={() => setActiveTab("inquiries")}
                            className={`pb-3 px-1 font-bold whitespace-nowrap transition-colors text-sm md:text-base ${activeTab === "inquiries" ? "text-fbla-orange border-b-2 border-fbla-orange" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Inquiries ({inquiries.filter(i => i.status === "OPEN").length})
                        </button>
                        <button
                            onClick={() => setActiveTab("claims")}
                            className={`pb-3 px-1 font-bold whitespace-nowrap transition-colors text-sm md:text-base ${activeTab === "claims" ? "text-fbla-orange border-b-2 border-fbla-orange" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Claims ({claims.filter(c => c.status === "PENDING").length})
                        </button>
                    </div>
                )}

                <section className="space-y-6">
                    {role === "ADMIN" && activeTab === "claims" ? (
                        <div className="space-y-6">
                            {claims.length > 0 ? claims.map((claim) => {
                                const item = allItems.find((i) => i.id === claim.itemId);
                                return (
                                    <div key={claim.id} className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
                                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                                            <div>
                                                <p className="text-xs text-gray-500">From: <span className="text-fbla-orange font-bold text-sm">{claim.username}</span></p>
                                                <p className="text-sm text-gray-700 font-medium">Claiming: &quot;{claim.itemTitle}&quot;</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase w-fit ${claim.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : claim.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {claim.status}
                                            </span>
                                        </div>

                                        {/* Side-by-side comparison */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {/* Claimant's answers */}
                                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                                <p className="text-xs font-bold uppercase text-fbla-orange mb-3">Claimant Says</p>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-bold">Location:</p>
                                                        <p className="text-gray-800">{claim.claimedLocation || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-bold">Description:</p>
                                                        <p className="text-gray-800 break-words">{claim.claimedDescription || claim.proof || "N/A"}</p>
                                                    </div>
                                                    {claim.additionalProof && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold">Additional Proof:</p>
                                                            <p className="text-gray-800 break-words">{claim.additionalProof}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actual item details */}
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <p className="text-xs font-bold uppercase text-fbla-blue mb-3">Actual Item</p>
                                                {item ? (
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold">Location:</p>
                                                            <p className="text-gray-800 font-medium">{item.location}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold">Description:</p>
                                                            <p className="text-gray-800 break-words">{item.description}</p>
                                                        </div>
                                                        {item.imageUrl && (
                                                            <div>
                                                                <p className="text-xs text-gray-500 font-bold mb-1">Image:</p>
                                                                <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover rounded-lg" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">Item no longer available</p>
                                                )}
                                            </div>
                                        </div>

                                        {claim.status === "PENDING" && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleClaimStatus(claim.id, claim.itemId, "APPROVED")}
                                                    className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-sm"
                                                >
                                                    Approve Claim
                                                </button>
                                                <button
                                                    onClick={() => handleClaimStatus(claim.id, claim.itemId, "REJECTED")}
                                                    className="flex-1 py-2 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                                                >
                                                    Reject Claim
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : <p className="text-gray-500 text-center py-10">No claims yet.</p>}
                        </div>
                    ) : role === "ADMIN" && activeTab === "inquiries" ? (
                        <div className="space-y-4">
                            {inquiries.length > 0 ? inquiries.map((inq) => (
                                <div key={inq.id} className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-500">From: <span className="text-fbla-blue font-bold text-sm">{inq.username}</span></p>
                                            <p className="text-sm text-gray-700 font-medium">About: "{inq.itemTitle}"</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase w-fit ${inq.status === "OPEN" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                                            {inq.status}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                                        <p className="text-sm text-gray-800 break-words">"{inq.message}"</p>
                                    </div>

                                    {inq.adminReply ? (
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                            <p className="text-xs text-fbla-blue font-bold mb-1">Your Reply:</p>
                                            <p className="text-sm text-gray-800 break-words">{inq.adminReply}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                placeholder="Type your reply..."
                                                value={replyText[inq.id] || ""}
                                                onChange={(e) => setReplyText({ ...replyText, [inq.id]: e.target.value })}
                                                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 sm:py-2 text-sm outline-none focus:border-fbla-blue focus:ring-1 focus:ring-fbla-blue text-gray-900"
                                            />
                                            <button
                                                onClick={() => handleReply(inq.id)}
                                                className="px-4 py-2 bg-fbla-blue text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-800 shadow-sm"
                                            >
                                                <Send className="w-4 h-4" /> Reply
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )) : <p className="text-gray-500 text-center py-10">No inquiries yet.</p>}
                        </div>
                    ) : role === "ADMIN" && activeTab === "all" ? (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-4 font-bold text-gray-600">Title</th>
                                            <th className="p-4 font-bold text-gray-600">Status</th>
                                            <th className="p-4 font-bold text-gray-600">Type</th>
                                            <th className="p-4 font-bold text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {allItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-medium text-gray-900">{item.title}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                        ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                item.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600">{item.type}</td>
                                                <td className="p-4 flex gap-2">
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    {item.status !== "APPROVED" && (
                                                        <button onClick={() => handleStatus(item.id, "APPROVED")} className="p-2 hover:bg-green-50 text-green-500 rounded-lg transition-colors" title="Approve">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {myItems.length > 0 ? myItems.map((item) => (
                                <ItemCard key={item.id} item={item} />
                            )) : <p className="text-gray-500 col-span-full py-10 text-center">No items found.</p>}
                        </div>
                    )}
                </section>
            </main>

            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                title="Delete Item"
                description="Are you sure you want to DELETE this item? This action cannot be undone."
                type="danger"
                onConfirm={confirmDelete}
                confirmText="Delete Item"
            />
        </div>
    );
}
