"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, ShieldCheck, Database, Check } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            LL
          </div>
          <span className="text-xl font-heading font-bold tracking-tight text-foreground">
            LedgerLens
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {status === "authenticated" ? (
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-2">
                Console Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative z-10 max-w-4xl mx-auto space-y-10">
        <div className="space-y-5">
          <h1 className="text-5xl sm:text-6xl font-heading font-bold tracking-tight leading-tight text-foreground">
            Turn messy bank statement text into clean, isolated ledger records — instantly
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
            Paste unstructured bank statement text. Automatically extract transactions, date tags, credits, debits, and running balances inside a secure, multi-tenant scoped ledger.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto pt-4">
          {status === "authenticated" ? (
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 flex items-center justify-center gap-2">
                Go to Workspace Console
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 flex items-center justify-center gap-2">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full border-border bg-card text-foreground hover:bg-secondary py-6">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-left">
          <div className="p-6 rounded-lg border border-border bg-card hover:border-muted transition duration-300 space-y-4">
            <FileText className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="text-lg font-heading font-semibold text-foreground">Multi-Format Regex Engine</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Intelligently parses Indian rupee, debit/credit word tags, dates, and balances from standard banker text blocks.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-muted transition duration-300 space-y-4">
            <ShieldCheck className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="text-lg font-heading font-semibold text-foreground">Secure Multi-Tenant Scoping</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Built on Better Auth organization isolation, guarding workspace logs so tenants never experience cross-talk or leakage.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-muted transition duration-300 space-y-4">
            <Database className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="text-lg font-heading font-semibold text-foreground">Cursor-Paginated Ledgers</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Constant-time O(1) indexed page fetching ensuring scale stability even when databases grow to millions of rows.
            </p>
          </div>
        </section>

        {/* Trust features */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-medium text-muted-foreground pt-8 border-t border-border w-full">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-primary" />
            No credit card required
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-primary" />
            Prisma & Better Auth integrated
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-primary" />
            100% data residency guarantee
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-20 relative z-10">
        © 2026 LedgerLens Inc. Built with Next.js, Hono, & Better Auth. All rights reserved.
      </footer>
    </div>
  );
}
