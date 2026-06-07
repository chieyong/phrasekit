import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AccessGate from "@/components/layout/AccessGate";

export const metadata: Metadata = {
  title: "PhraseKit Japan",
  description:
    "Japanse reiszinnen voor onderweg, altijd bij de hand. Gemaakt door VizCraft.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PhrasePath",
  },
  icons: {
    apple: "/icon-192.png",
  },
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
      {/* Anti-flash: apply saved theme before hydration */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t=localStorage.getItem('phrasekit-theme');
            if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){
              document.documentElement.classList.add('dark');
            }
          })();
        `}} />
      </head>
      <body className="min-h-full bg-[var(--bg)] antialiased transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <div className="relative max-w-md mx-auto min-h-screen bg-[var(--bg)] shadow-xl transition-colors duration-200">
                <AccessGate>
                  {children}
                </AccessGate>
              </div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
