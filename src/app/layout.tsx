import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AccessGate from "@/components/layout/AccessGate";

export const metadata: Metadata = {
  title: "PhraseKit Japan",
  description:
    "Japanse reiszinnen voor onderweg, altijd bij de hand. Gemaakt door VizCraft.",
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
          <div className="relative max-w-md mx-auto min-h-screen bg-[#f5f2ee] shadow-xl">
            <AccessGate>
              {children}
            </AccessGate>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
