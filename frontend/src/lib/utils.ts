/**
 * Utility: Tailwind CSS Class Merger
 * ───────────────────────────────────
 * Combines multiple class names intelligently. Uses clsx to handle
 * conditional classes and twMerge to resolve Tailwind conflicts
 * (e.g., "p-4" + "p-2" → "p-2", keeping only the last one).
 *
 * Usage: cn("bg-blue-500", isActive && "bg-red-500", "text-white")
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
