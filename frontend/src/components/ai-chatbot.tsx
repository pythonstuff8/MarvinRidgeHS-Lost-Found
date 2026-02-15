"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    role: "user" | "assistant";
    content: string;
};

const SYSTEM_PROMPT = `You are FindBot, a helpful AI assistant for the Marvin Ridge High School Lost & Found website. 
Your job is to help students find lost items, report found items, and navigate the website.
Keep responses short and friendly. If asked about specific items, remind users to check the Browse Items page.
Key features of the website:
- Browse Items: See all approved lost/found items
- Report: Submit a lost or found item (goes to admin for approval)
- Map: See item locations on a 3D map
- Dashboard: Check status of your reports
- Notifications: See admin replies to your inquiries`;

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! 👋 I'm FindBot. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: "user", content: userMessage }],
                    systemPrompt: SYSTEM_PROMPT
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
            } else {
                // Fallback response if API fails
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: "I'm having trouble connecting right now. Try browsing items at /items or report something at /report!"
                }]);
            }
        } catch (e) {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Oops! Something went wrong. You can still use the site normally - check out Browse Items or Report!"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-fbla-orange to-fbla-blue text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ maxHeight: "70vh" }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-fbla-orange to-fbla-blue p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">FindBot</h3>
                                <p className="text-xs text-white/70">AI Assistant</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "300px" }}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-fbla-blue" : "bg-gray-700"}`}>
                                        {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${msg.role === "user" ? "bg-fbla-blue text-white rounded-tr-none" : "bg-gray-800 text-gray-100 rounded-tl-none"}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="px-4 py-2 rounded-2xl bg-gray-800 text-gray-400 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-fbla-blue"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="p-2 bg-fbla-blue text-white rounded-xl hover:bg-fbla-blue/80 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
