import { Sidebar } from "@/components/layout/Sidebar";
import React from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-bg-base text-text-primary selection:bg-indigo-500/30">
      <Sidebar />
      <main className="flex-1 ml-[240px] pl-0">
        {/* We place children inside this main wrapper which clears the 240px sidebar width */}
        {children}
      </main>
    </div>
  );
}
