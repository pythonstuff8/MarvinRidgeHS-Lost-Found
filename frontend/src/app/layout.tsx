/**
 * Root Layout
 * ───────────
 * This is the top-level layout component for the entire Next.js application.
 * It wraps every page and provides:
 *   - Global fonts (Geist Sans and Geist Mono from Google Fonts)
 *   - PWA metadata (manifest, theme color, mobile web app settings)
 *   - The AuthProvider context (so every page can access user/role/auth functions)
 *   - A "Skip to main content" link for keyboard accessibility (WCAG compliance)
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Load Google Fonts with CSS custom property names for Tailwind
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO and PWA metadata — used by browsers, search engines, and mobile devices
export const metadata: Metadata = {
  title: "Marvin Ridge Lost & Found",
  description: "Official lost and found portal for Marvin Ridge High School.",
  manifest: "/manifest.json",          // PWA manifest for installable web app
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MRHS L&F",
  },
  formatDetection: {
    telephone: false,                   // Prevent auto-linking phone numbers
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",              // Safe area support for notched devices
  },
  themeColor: "#003058",              // MRHS navy blue for browser chrome
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

// AuthProvider wraps the entire app so every page can use useAuth()
import { AuthProvider } from "@/context/auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Accessibility: hidden link that becomes visible on Tab press,
            allowing keyboard users to skip directly to main content */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        {/* AuthProvider makes user/role/login/signup/logout available everywhere */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
