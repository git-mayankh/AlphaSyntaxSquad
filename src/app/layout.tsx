import type { Metadata } from "next";
import { DM_Sans, Caveat, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
  title: "IdeaForge — Collaborative AI Brainstorming",
  description: "The creative studio for teams to brainstorm, ideate, and build together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${caveat.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-inter, Inter, -apple-system, sans-serif)",
          background: "var(--bg)",
          color: "var(--text-1)",
        }}
      >
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        <Toaster
          position="bottom-right"
          theme="light"
          richColors
          toastOptions={{
            style: {
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              borderRadius: 10,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
            }
          }}
        />
      </body>
    </html>
  );
}
