import type { Metadata } from "next";
import { Syne, DM_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IdeaForge | Collaborate brilliantly",
  description: "The premier real-time brainstorming platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${caveat.variable}`}>
      <body className="antialiased" style={{ backgroundColor: "var(--canvas-bg)", color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, DM Sans, sans-serif)" }}>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        <Toaster position="bottom-right" theme="light" richColors />
      </body>
    </html>
  );
}
