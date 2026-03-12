import { Sidebar } from "@/components/layout/Sidebar";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      <Sidebar />
      {/* Main content dynamically fills space alongside sticky sidebar */}
      <main
        className="flex-1 transition-all duration-200"
        style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {children}
      </main>
    </div>
  );
}
