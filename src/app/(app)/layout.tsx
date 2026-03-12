import { Sidebar } from "@/components/layout/Sidebar";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      <Sidebar />
      {/* Main content starts at 240px (sidebar expanded) — sidebar handles its own fixed positioning */}
      <main
        className="flex-1 transition-all duration-200"
        style={{ marginLeft: 240, minHeight: "100vh" }}
      >
        {children}
      </main>
    </div>
  );
}
