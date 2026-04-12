import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "PhrasePath — Japanse Reiszinnen",
  description:
    "Snelle Japanse reiszinnen voor onderweg, altijd bij de hand.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#141210",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full bg-[#f5f2ee] antialiased">
        <AuthProvider>
          {/* Max-width container keeps it phone-sized even on desktop */}
          <div className="relative max-w-md mx-auto min-h-screen bg-[#f5f2ee] shadow-xl">
            {children}
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
