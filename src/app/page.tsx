"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap, ArrowRight, Play, Sparkles, BarChart2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -50]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 50]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* --- FLOATING HEADER --- */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 ${
          scrolled 
            ? "w-[min(90vw,900px)] bg-bg-elevated/80 backdrop-blur-xl border border-border-default shadow-[var(--shadow-modal)]" 
            : "w-[min(95vw,1100px)] bg-transparent border-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-display font-bold text-lg text-text-primary">IdeaForge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link href="/auth">
            <Button size="sm" variant="primary">Start Free</Button>
          </Link>
        </div>
      </motion.header>

      {/* --- HERO SECTION --- */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.12)_0%,transparent_65%)] pointer-events-none" />
        
        {/* Floating Orbs */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-[15%] left-[10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent)] rounded-full blur-[80px] -z-10 animate-[float_8s_ease-in-out_infinite]"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[20%] right-[8%] w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(34,211,238,0.10),transparent)] rounded-full blur-[100px] -z-10 animate-[float_10s_ease-in-out_infinite_reverse]"
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-[800px] mx-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 text-[13px] tracking-[0.08em] uppercase font-medium mb-8"
          >
            ✦ Real-time Collaboration + AI
          </motion.div>

          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display font-bold text-[48px] sm:text-[72px] leading-[1.1] tracking-tight mb-6"
          >
            <span className="text-text-primary block">Where Ideas</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500 block pb-2">Come Alive</span>
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-text-secondary text-lg sm:text-[18px] max-w-[540px] leading-[1.7] mb-10"
          >
            Brainstorm together in real-time. Let AI spark new directions. 
            Vote for the best ideas. Build something extraordinary.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, staggerChildren: 0.1 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            <Link href="/auth">
              <Button size="lg" className="group">
                Start Brainstorming — It's Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="secondary" icon={<Play className="w-4 h-4 fill-current" />}>
              Watch Demo
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <p className="text-text-tertiary text-[13px] uppercase tracking-wider font-medium">Trusted by innovative teams</p>
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12 opacity-50 grayscale">
              <div className="h-8 w-24 bg-border-strong rounded-md" />
              <div className="h-8 w-32 bg-border-strong rounded-md" />
              <div className="h-8 w-28 bg-border-strong rounded-md" />
              <div className="h-8 w-24 bg-border-strong rounded-md" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- MOCKUP SECTION --- */}
      <section className="relative w-full max-w-[1100px] mx-auto px-6 -mt-32 mb-32 z-20">
        <motion.div 
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          whileInView={{ y: 0, opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring", damping: 25 }}
          className="w-full glass-card rounded-[24px] rounded-t-[32px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-indigo-500/20"
        >
          {/* Browser Chrome */}
          <div className="h-12 bg-bg-surface border-b border-border-default flex items-center px-4 relative">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-border-strong" />
              <div className="w-3 h-3 rounded-full bg-border-strong" />
              <div className="w-3 h-3 rounded-full bg-border-strong" />
            </div>
            {/* Live Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-full font-medium shadow-[0_0_15px_rgba(248,113,113,0.3)]">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-[pulse_1.5s_ease-in-out_infinite]" />
              Live — 5 people collaborating
            </div>
          </div>
          {/* Mockup Body */}
          <div className="h-[500px] bg-bg-base bg-grid p-6 pb-0 overflow-hidden relative">
            
            {/* Fake toolbar */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-bg-base/80 backdrop-blur border-b border-border-subtle flex items-center px-6 gap-4 pointer-events-none z-10">
              <div className="h-9 w-28 rounded-full bg-indigo-500 shadow-glow-indigo" />
              <div className="h-8 w-20 rounded-full bg-bg-surface border border-indigo-500/50" />
              <div className="h-8 w-16 rounded-full bg-bg-elevated border border-border-subtle" />
            </div>
            
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)", maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)" }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card rounded-xl border-border-subtle overflow-hidden relative transition-all duration-300 transform hover:-translate-y-1">
                  <div className={`h-1 w-full ${['bg-indigo-400', 'bg-cyan-400', 'bg-pink-400', 'bg-amber-400'][i%4]}`} />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="h-4 w-3/4 bg-border-subtle rounded-sm" />
                    <div className="h-3 w-full bg-border-subtle/50 rounded-sm" />
                    <div className="h-3 w-5/6 bg-border-subtle/50 rounded-sm" />
                    <div className="h-3 w-4/6 bg-border-subtle/50 rounded-sm" />
                    <div className="mt-4 pt-3 border-t border-border-subtle flex justify-between items-center">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full border border-bg-surface bg-indigo-400/50 flex items-center justify-center text-[8px] text-white">PJ</div>
                        <div className="w-6 h-6 rounded-full border border-bg-surface bg-cyan-400/50 flex items-center justify-center text-[8px] text-white">MK</div>
                      </div>
                      <div className="flex items-center gap-1 text-text-tertiary">
                        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                           ▲ {12 + i * 4}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="max-w-[1100px] mx-auto px-6 py-24 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-8 hover:-translate-y-2 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center mb-6 border border-indigo-500/20">
              <Zap className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">Real-Time Ideas</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              Experience zero-latency brainstorming. See cursors dance, ideas pop up instantly, and votes tally live as your team collaborates.
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-8 hover:-translate-y-2 hover:border-cyan-500/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-6 border border-cyan-500/20">
              <Sparkles className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">AI Co-Pilot</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              Stuck? Our AI assistant can generate novel directions, improve existing ideas, or synthesize an executive summary of the session.
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-8 hover:-translate-y-2 hover:border-green-500/50 hover:shadow-[0_0_40px_rgba(74,222,128,0.15)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mb-6 border border-green-500/20">
              <BarChart2 className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">Smart Voting</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              Surface the best ideas democratically. Use limited voting tokens, filter by categories, and see the winning ideas automatically rise to the top.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- HOW IT WORKS / SOCIAL PROOF --- */}
      <section className="w-full bg-[linear-gradient(180deg,var(--bg-base)_0%,var(--bg-surface)_100%)] border-t border-border-subtle py-24 px-6 overflow-hidden">
        <div className="max-w-[900px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
            {/* Dashed line connecting steps */}
            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-border-strong -z-10" />
            
            <div className="flex flex-col items-center text-center max-w-[260px]">
              <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-600 flex items-center justify-center font-display font-bold text-xl mb-6 shadow-glow-indigo">1</div>
              <h4 className="font-display text-lg font-semibold text-text-primary mb-3">Create a Session</h4>
              <p className="text-text-secondary text-[14px]">Define the problem and invite your team with a simple link.</p>
            </div>

            <div className="flex flex-col items-center text-center max-w-[260px]">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-display font-bold text-xl mb-6">2</div>
              <h4 className="font-display text-lg font-semibold text-text-primary mb-3">Brainstorm Freely</h4>
              <p className="text-text-secondary text-[14px]">Everyone drops their ideas onto the board in real-time.</p>
            </div>

            <div className="flex flex-col items-center text-center max-w-[260px]">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-display font-bold text-xl mb-6">3</div>
              <h4 className="font-display text-lg font-semibold text-text-primary mb-3">Vote & Decide</h4>
              <p className="text-text-secondary text-[14px]">The best ideas bubble up. Export the winners and build them.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="w-full bg-[linear-gradient(135deg,rgba(99,102,241,0.10),rgba(34,211,238,0.05))] border-y border-border-subtle py-32 px-6 text-center">
        <h2 className="font-display font-bold text-[40px] text-text-primary mb-6">Ready to spark brilliance?</h2>
        <p className="text-text-secondary text-lg mb-10 max-w-[500px] mx-auto">
          Join thousands of teams who have already transformed the way they ideate, collaborate, and execute.
        </p>
        <Link href="/auth">
          <Button size="lg" className="px-10 py-4 shadow-glow-indigo">
            Start Your First Session
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
        <p className="text-text-tertiary text-[13px] mt-6 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-400" /> No credit card required. Free forever plan available.
        </p>
      </section>

      {/* --- FOOTER --- */}
      <footer className="w-full bg-bg-surface py-12 px-6 border-t border-border-subtle">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500 fill-indigo-500" />
            <span className="font-display font-bold text-[15px] text-text-primary">IdeaForge</span>
          </div>
          <div className="flex gap-8 text-sm text-text-secondary">
            <Link href="#" className="hover:text-text-primary transition-colors">Product</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Templates</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Legal</Link>
          </div>
          <div className="text-[13px] text-text-tertiary">
            © {new Date().getFullYear()} IdeaForge Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
