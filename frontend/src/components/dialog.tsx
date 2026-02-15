import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    type?: "info" | "success" | "warning" | "danger";
}

export function Dialog({
    isOpen,
    onClose,
    title,
    description,
    children,
    confirmText,
    cancelText,
    onConfirm,
    type = "info",
}: DialogProps) {
    // Unlike native alerts, we don't block execution, so isOpen handles visibility
    // But we need to ensure it's rendered at the root or has high Z-index
    if (!isOpen) return null;

    const isConfirm = !!onConfirm;
    const effectiveCancelText = cancelText || (isConfirm ? "Cancel" : "Close");

    const getIcon = () => {
        switch (type) {
            case "danger": return <AlertTriangle className="w-6 h-6 text-red-600" />;
            case "warning": return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
            case "success": return <CheckCircle className="w-6 h-6 text-green-600" />;
            default: return <Info className="w-6 h-6 text-blue-600" />;
        }
    };

    const getConfirmButtonStyle = () => {
        switch (type) {
            case "danger": return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
            case "warning": return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
            case "success": return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
            default: return "bg-fbla-blue hover:bg-blue-800 focus:ring-blue-500";
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Dialog Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 p-2 rounded-full bg-gray-50`}>
                                    {getIcon()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 leading-6 mb-2">
                                        {title}
                                    </h3>
                                    {(description || children) && (
                                        <div className="text-sm text-gray-500">
                                            {description && <p>{description}</p>}
                                            {children}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                                >
                                    {effectiveCancelText}
                                </button>
                                {isConfirm && (
                                    <button
                                        onClick={() => {
                                            if (onConfirm) onConfirm();
                                        }}
                                        className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${getConfirmButtonStyle()}`}
                                    >
                                        {confirmText || "Confirm"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
