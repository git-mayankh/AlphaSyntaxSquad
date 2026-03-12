import { Sidebar } from "@/components/layout/Sidebar";
import React from "react";

/**
 * App Layout
 * 
 * Structure:
 *  - Sidebar (fixed width, sticky left, z-index: 10)
 *  - Main content area (flex-grow: 1, z-index: 1)
 * 
 * All children (dashboard, session, etc.) render inside <main>
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#F4F4F6",
      }}
    >
      <Sidebar />
      <main
        style={{
          flexGrow: 1,
          overflow: "auto",
          position: "relative",
          zIndex: 1,
          minWidth: 0,             // prevent flex overflow
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
    </div>
  );
}
