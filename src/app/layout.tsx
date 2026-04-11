import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "PhrasePath — Japan Travel Phrases",
  description:
    "Calm, fast travel phrase companion for Japan. Situation-based phrases at your fingertips.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#faf9f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#faf9f7] antialiased">
        {/* Max-width container keeps it phone-sized even on desktop */}
        <div className="relative max-w-md mx-auto min-h-screen bg-[#faf9f7] shadow-xl">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
