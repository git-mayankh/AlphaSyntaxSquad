"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { UserRound, Mail, Calendar, Settings as SettingsIcon, LogOut, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url, created_at")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently";
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.email || "User")}&background=6366f1&color=fff`;

  return (
    <div className="min-h-screen bg-bg-base pt-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <SettingsIcon className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
          <p className="text-text-secondary text-sm">Manage your profile and account preferences.</p>
        </div>
      </div>

      <div className="bg-bg-elevated border border-border-default rounded-[24px] overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border-b border-border-default relative">
          {/* Cover background pattern */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
        </div>
        
        <div className="px-6 sm:px-10 pb-10 relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-12 sm:-mt-16 mb-8 relative z-10">
            <div className="p-1.5 bg-bg-elevated rounded-full shrink-0 border border-border-default shadow-xl">
               <img 
                 src={avatarUrl} 
                 alt="Avatar" 
                 className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover bg-bg-base"
               />
            </div>
            
            <div className="flex-grow space-y-1">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                {profile?.name || "User"}
              </h2>
              <p className="text-text-secondary flex items-center gap-1.5 text-sm">
                 <Mail className="w-3.5 h-3.5" />
                 {user?.email}
              </p>
            </div>
            
            <Button 
               variant="secondary" 
               className="shrink-0 rounded-full lg:w-auto w-full group hover:border-red-500/50 hover:text-red-400 transition-colors"
               onClick={handleSignOut}
             >
               <LogOut className="w-4 h-4 mr-2 group-hover:text-red-400 transition-colors" /> Sign Out
            </Button>
          </div>

          <div className="grid gap-6 max-w-2xl mt-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Profile Information</h3>
              
              <div className="bg-bg-base border border-border-default rounded-2xl p-4 space-y-4">
                
                <div className="flex items-center gap-4 p-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <UserRound className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-medium text-text-secondary mb-0.5">Full Name</p>
                    <p className="text-sm text-text-primary font-medium truncate">{profile?.name || "Not set"}</p>
                  </div>
                </div>
                
                <div className="h-px bg-border-default ml-16" />

                <div className="flex items-center gap-4 p-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-medium text-text-secondary mb-0.5">Email Address</p>
                    <p className="text-sm text-text-primary font-medium truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="h-px bg-border-default ml-16" />

                <div className="flex items-center gap-4 p-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-medium text-text-secondary mb-0.5">Joined IdeaForge</p>
                    <p className="text-sm text-text-primary font-medium truncate">{joinDate}</p>
                  </div>
                </div>
                
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
