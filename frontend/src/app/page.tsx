"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, ArrowRight, ShieldCheck, Zap, Database, Check } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] h-[700px] w-[700px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none" />

      {/* Navbar */}
      <header className="border-b border-slate-900 bg-[#070a13]/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/20">
            LL
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            LedgerLens
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {status === "authenticated" ? (
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium flex items-center gap-2">
                Console Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900/50">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative z-10 max-w-5xl mx-auto space-y-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Bank Statement Parser
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Extract & Organize Raw <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Bank Statements In Seconds
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 font-medium">
            Paste unstructured bank statement text. Automatically extract transactions, date tags, credits, debits, and running balances inside a secure, multi-tenant scoped ledger.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto pt-2">
          {status === "authenticated" ? (
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-6 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2">
                Go to Workspace Console
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register" className="w-full">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-6 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full border-slate-800 bg-slate-900/50 text-slate-200 hover:bg-slate-900 hover:text-white py-6">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-left">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/30 backdrop-blur-sm hover:border-slate-800/80 hover:bg-slate-950/50 transition duration-300 space-y-4">
            <div className="h-10 w-10 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Format Regex Engine</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Intelligently parses Indian rupee, debit/credit word tags, dates, and balances from standard banker text blocks.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/30 backdrop-blur-sm hover:border-slate-800/80 hover:bg-slate-950/50 transition duration-300 space-y-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Secure Multi-Tenant Scoping</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Built on Better Auth organization isolation, guarding workspace logs so tenants never experience cross-talk or leakage.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/30 backdrop-blur-sm hover:border-slate-800/80 hover:bg-slate-950/50 transition duration-300 space-y-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Cursor-Paginated Ledgers</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Constant-time O(1) indexed page fetching ensuring scale stability even when databases grow to millions of rows.
            </p>
          </div>
        </section>

        {/* Trust features */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-500 pt-8 border-t border-slate-900 w-full">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-violet-400" />
            No credit card required
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-violet-400" />
            Prisma & Better Auth integrated
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-violet-400" />
            100% data residency guarantee
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 mt-20 relative z-10">
        © 2026 LedgerLens Inc. Built with Next.js, Hono, & Better Auth. All rights reserved.
      </footer>
    </div>
  );
}
