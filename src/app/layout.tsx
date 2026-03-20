import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ZenFlow - Votre Allié Sérénité",
  description: "L'application de To-Do list qui réduit votre charge mentale.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f8f5f8",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans bg-[#f8f5f8] text-slate-900 min-h-screen flex flex-col items-center">
        <ThemeProvider>
          <div className="w-full max-w-md bg-[#f8f5f8] min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
