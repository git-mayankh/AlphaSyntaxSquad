"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Layers, Star, BarChart3, Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [profile, setProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        // Fallback: use auth metadata
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setProfile({ name, avatar_url: null });
      }
    };

    loadProfile();

    // Subscribe to auth changes (e.g., token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/auth");
      if (event === "SIGNED_IN") loadProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth");
      toast.success("Signed out.");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Sessions", href: "/sessions", icon: Layers },
  ];

  const displayName = profile?.name || "Loading...";
  const firstName = displayName.split(" ")[0];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-bg-surface border-r border-border-subtle flex flex-col pt-5 pb-5 px-4 z-40">
      
      {/* Top Section */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <Avatar 
          name={displayName} 
          src={profile?.avatar_url || undefined} 
          size="md" 
          online 
        />
        <div className="flex flex-col min-w-0">
          <span className="text-text-secondary text-xs">Welcome back,</span>
          <span className="font-display text-[15px] font-semibold text-text-primary leading-tight truncate">{firstName}.</span>
        </div>
      </div>
      
      <div className="h-px bg-border-subtle w-full mb-6" />

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-indigo-500/12 text-indigo-400 border-l-2 border-indigo-500"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary border-l-2 border-transparent"
              )}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-1.5">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all duration-200 border-l-2 border-transparent"
        >
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full text-left border-l-2 border-transparent"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
      
    </aside>
  );
};
