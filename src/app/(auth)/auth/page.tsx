"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";

import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Suspense } from "react";

function AuthPageInner() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";

      if (activeTab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          }
        });
        
        if (error) throw error;
        
        // Check if email confirmation required
        if (data.user && !data.session) {
          setConfirmationSent(true);
          toast.success("Check your email to confirm your account!");
          return;
        }

        // If sign-up + auto-login (email confirmation disabled)
        if (data.user && data.session) {
          // Profile trigger will handle profile creation, but upsert as backup
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: fullName,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`
          });
          toast.success("Account created! Welcome to IdeaForge.");
          router.push(redirectTo);
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          toast.error("Sign-in failed. Please try again.");
          return;
        }
        toast.success("Signed in successfully!");
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error: any) {
      const msg = error.message || "Authentication failed";
      const friendlyMsg = msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("email rate")
        ? "Too many sign-up attempts. Please wait a few minutes, or disable email confirmation in Supabase Dashboard → Auth → Providers → Email."
        : msg.toLowerCase().includes("email not confirmed")
        ? "Please confirm your email first, then sign in."
        : msg.toLowerCase().includes("invalid login")
        ? "Incorrect email or password."
        : msg;
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  // Email confirmation screen
  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="glass-card p-12 rounded-2xl text-center max-w-sm w-full mx-4">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-indigo-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Confirm your email</h2>
          <p className="text-text-secondary text-sm mb-6">
            We sent an email to <strong className="text-text-primary">{email}</strong>.<br />
            Click the link in the email to activate your account.
          </p>
          <button onClick={() => { setConfirmationSent(false); setActiveTab("signin"); }} className="text-indigo-500 text-sm hover:text-indigo-600 transition-colors">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-indigo-500/30">
      {/* LEFT PANEL - unchanged */}
      <div className="hidden lg:flex w-1/2 flex-col relative overflow-hidden bg-[linear-gradient(160deg,#0F0F20,#07070C)] border-r border-border-default">
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-50" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent)] rounded-full blur-[80px]" />
        
        <div className="flex flex-col justify-center h-full px-16 max-w-[600px] mx-auto z-10">
          <h2 className="font-display italic text-[32px] lg:text-[40px] text-white leading-[1.2] mb-6 shadow-glow-indigo">
            "The best ideas start with 'What if...'"
          </h2>
          <p className="text-text-secondary text-lg mb-16 max-w-md">
            Join the most innovative teams brainstorming, voting, and building the future together.
          </p>

          <div className="relative w-full h-[200px]">
            {/* Testimonial Cards */}
            <motion.div 
              initial={{ y: 20, opacity: 0, rotate: -2 }}
              animate={{ y: 0, opacity: 1, rotate: -2 }}
              transition={{ delay: 0.1 }}
              className="absolute left-0 top-0 w-[300px] bg-white/90 backdrop-blur-md border border-white/50 shadow-lg p-4 rounded-xl -rotate-2 hover:z-20 hover:rotate-0 hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                <Avatar name="Alex Rivera" size="sm" />
                <span className="font-semibold text-gray-900 text-[13px]">Alex Rivera</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                "We shaved weeks off our initial feature planning. The real-time voting changed everything."
              </p>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0, rotate: 0 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute left-12 top-16 w-[300px] bg-white border border-gray-200 shadow-xl p-4 rounded-xl z-10 hover:z-20 hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                <Avatar name="Priya Patel" size="sm" />
                <span className="font-semibold text-gray-900 text-[13px]">Priya Patel</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                "The AI co-pilot suggested a direction we hadn't even considered. It's like having a brilliant extra team member."
              </p>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0, rotate: 2 }}
              animate={{ y: 0, opacity: 1, rotate: 2 }}
              transition={{ delay: 0.3 }}
              className="absolute left-24 top-32 w-[300px] bg-white/90 backdrop-blur-md border border-white/50 shadow-lg p-4 rounded-xl rotate-2 hover:z-20 hover:rotate-0 hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                <Avatar name="Jordan Lee" size="sm" />
                <span className="font-semibold text-gray-900 text-[13px]">Jordan Lee</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                "Finally, a brainstorming tool that actually feels fast. The keyboard shortcuts are a lifesaver."
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[420px] glass-card p-10 rounded-xl relative overflow-hidden">
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <Zap className="w-6 h-6 text-indigo-500 fill-indigo-500" />
            <span className="font-display font-bold text-2xl text-text-primary tracking-tight">IdeaForge</span>
          </div>

          <div className="flex items-center p-1 bg-bg-surface rounded-full mb-8 relative border border-border-subtle">
            <button
              className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${activeTab === 'signin' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${activeTab === 'signup' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
            <motion.div 
              layoutId="auth-tab"
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-bg-elevated border border-border-default rounded-full shadow-sm"
              initial={false}
              animate={{
                left: activeTab === 'signin' ? 4 : '50%',
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          </div>

          <div className="relative overflow-hidden w-full" style={{ minHeight: '380px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'signin' ? (
                <motion.div
                  key="signin"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <Input 
                      label="Email address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      icon={<Mail className="w-4 h-4" />}
                    />
                    <div>
                      <Input 
                        label="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        icon={<Lock className="w-4 h-4" />}
                      />
                      <div className="flex justify-between items-center mt-1 px-1">
                        <span />
                        <Link href="#" className="text-[13px] text-indigo-500 font-medium hover:text-indigo-600 transition-colors">
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={loading} className="w-full mt-4 !font-display !font-semibold !text-[16px]">
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <Input 
                      label="Full name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Sarah Jenkins"
                    />
                    <Input 
                      label="Email address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      icon={<Mail className="w-4 h-4" />}
                    />
                    <div>
                      <Input 
                        label="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        icon={<Lock className="w-4 h-4" />}
                      />
                      {/* Password Strength Meter */}
                      <div className="mt-2 flex gap-1 px-1">
                        <div className="h-1 flex-1 bg-green-400 rounded-full" />
                        <div className="h-1 flex-1 bg-green-400/30 rounded-full" />
                        <div className="h-1 flex-1 bg-border-strong rounded-full" />
                        <div className="h-1 flex-1 bg-border-strong rounded-full" />
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-1 px-1 text-right">Fair</p>
                    </div>

                    <label className="flex items-start gap-2 mt-2 px-1 cursor-pointer group">
                      <input type="checkbox" required className="mt-0.5 w-4 h-4 rounded border-border-default bg-bg-surface text-indigo-500 focus:ring-indigo-500 focus:ring-offset-bg-base cursor-pointer" />
                      <span className="text-[13px] text-text-secondary leading-snug group-hover:text-text-primary transition-colors">
                        I agree to the <Link href="#" className="text-text-primary underline decoration-border-default underline-offset-2">Terms</Link> and <Link href="#" className="text-text-primary underline decoration-border-default underline-offset-2">Privacy Policy</Link>
                      </span>
                    </label>
                    
                    <Button type="submit" disabled={loading} className="w-full mt-4 !font-display !font-semibold !text-[16px]">
                      {loading ? "Creating..." : "Create Account"} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6">
              <div className="relative flex items-center mb-6">
                <div className="h-px flex-1 bg-border-subtle" />
                <span className="px-3 text-[13px] text-text-tertiary">or continue with</span>
                <div className="h-px flex-1 bg-border-subtle" />
              </div>

              <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}
