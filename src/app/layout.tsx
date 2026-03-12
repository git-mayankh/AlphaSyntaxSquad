import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
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
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-body text-text-primary bg-bg-base antialiased selection:bg-indigo-500/30">
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
