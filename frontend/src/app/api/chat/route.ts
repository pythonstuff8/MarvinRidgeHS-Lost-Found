import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        const userMessage = messages[messages.length - 1]?.content || "";

        // Call Python backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage })
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ reply: data.reply });
        } else {
            return NextResponse.json({
                reply: getSmartFallback(userMessage)
            });
        }

    } catch (error) {
        const userMessage = "";
        return NextResponse.json({
            reply: getSmartFallback(userMessage)
        });
    }
}

function getSmartFallback(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("lost") || lowerQuery.includes("find")) {
        return "To find lost items, check out our Browse Items page at /items!";
    }
    if (lowerQuery.includes("report") || lowerQuery.includes("found")) {
        return "To report a lost or found item, go to /report. An admin will review it!";
    }
    if (lowerQuery.includes("help") || lowerQuery.includes("how")) {
        return "Browse Items to search, Report to submit, Dashboard to check status. Need anything else?";
    }
    if (lowerQuery.includes("admin") || lowerQuery.includes("contact")) {
        return "Click 'Ask Admin / Inquiry' on any item's detail page to message admins!";
    }
    if (lowerQuery.includes("map")) {
        return "Check out the Map page at /map to see item locations!";
    }

    return "I can help you find lost items, report something, or navigate the site. What would you like to do?";
}
