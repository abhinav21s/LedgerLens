"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { 
  FileText, 
  History, 
  LogOut, 
  Database, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balanceAfter: number;
  confidence: number;
  rawText: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);

  const sampleTexts = [
    "11 Dec 2025 Transfer to John ₹1,250.00 debited Balance ₹5,000.00",
    "12/11/2025 Groceries Store ₹2,999.00 Dr Balance ₹2,001.00",
    "2025-12-10 Salary -420.00 Balance 12458.73",
  ];

  const fetchTransactions = useCallback(async (cursorId?: string) => {
    if (!session || !session.user) return;
    setFetchingTransactions(true);

    try {
      const accessToken = (session as any).accessToken;
      const endpoint = cursorId 
        ? `/api/transactions?limit=5&cursor=${cursorId}` 
        : "/api/transactions?limit=5";

      const res = await apiFetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        if (result.status === "success") {
          if (cursorId) {
            setTransactions((prev) => [...prev, ...result.data]);
          } else {
            setTransactions(result.data);
          }
          setNextCursor(result.nextCursor);
        }
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setFetchingTransactions(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchTransactions();
    }
  }, [status, router, fetchTransactions]);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const accessToken = (session as any).accessToken;
      const res = await apiFetch("/api/transactions/extract", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text }),
      });

      const result = await res.json();

      if (res.ok && result.status === "success") {
        setFeedback({
          type: "success",
          message: `Successfully parsed transaction! Confidence: ${(result.data.confidence * 100).toFixed(0)}%`,
        });
        setText("");
        fetchTransactions();
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Failed to parse bank statement text.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: "An unexpected network error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  // Average confidence calculator
  const avgConfidence = transactions.length 
    ? (transactions.reduce((acc, t) => acc + t.confidence, 0) / transactions.length) * 100 
    : 100;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a13] text-slate-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Syncing secure ledger session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background ambient glow shapes */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      {/* Navigation bar */}
      <nav className="border-b border-slate-900 bg-[#070a13]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/20">
            LL
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            LedgerLens
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
            Multi-Tenant
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block border-r border-slate-800 pr-4 mr-2">
            <p className="text-sm font-semibold text-slate-200">{session?.user?.name}</p>
            <p className="text-xs text-slate-500 font-mono">{(session as any).orgId ? `Org ID: ${(session as any).orgId.substring(0, 8)}...` : 'Personal'}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* KPI Cards / Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-900 bg-slate-950/40 backdrop-blur shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ledger Count</p>
                <p className="text-3xl font-extrabold text-white">{transactions.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <History className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-900 bg-slate-950/40 backdrop-blur shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-500" />
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Engine Confidence</p>
                <p className="text-3xl font-extrabold text-white">{avgConfidence.toFixed(0)}%</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-900 bg-slate-950/40 backdrop-blur shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-emerald-500" />
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Database Status</p>
                <p className="text-3xl font-extrabold text-white">Active</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Parser Engine Console */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-900 bg-slate-950/50 backdrop-blur shadow-xl">
              <CardHeader className="flex flex-row items-center space-x-3">
                <div className="p-2 rounded bg-violet-600/10 border border-violet-500/20 text-violet-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-bold">Parser Console</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Input raw bank statement text blocks to extract date, description, amounts, and balances.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleParse} className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder="Paste your statement text block here..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-36 border-slate-900 bg-slate-950/50 text-slate-100 placeholder:text-slate-600 focus-visible:ring-violet-500"
                    />
                  </div>

                  {feedback && (
                    <div
                      className={`rounded-lg p-3 text-sm border flex items-start gap-2.5 ${
                        feedback.type === "success"
                          ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/5 text-red-400 border-red-500/20"
                      }`}
                    >
                      {feedback.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold tracking-wide py-5 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 transition-all duration-300"
                    disabled={loading || !text.trim()}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Analyzing Statement Patterns...
                      </>
                    ) : (
                      <>
                        Parse & Save Record
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Test Presets Console */}
          <div>
            <Card className="border-slate-900 bg-slate-950/50 backdrop-blur shadow-xl h-full">
              <CardHeader className="flex flex-row items-center space-x-3">
                <div className="p-2 rounded bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-bold">Statement Presets</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Quickly test our parser engine using standard multi-format bank statement layouts.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sampleTexts.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setText(sample);
                      setFeedback(null);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-slate-900 bg-[#0c0f1b] hover:bg-slate-900 hover:border-slate-800/80 transition-all duration-300 text-xs font-mono text-slate-400 hover:text-slate-200 group"
                  >
                    <span className="block font-bold text-violet-400 mb-1.5 group-hover:text-violet-300 transition-colors">Format {idx + 1}:</span>
                    <span className="line-clamp-2">{sample}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ledger Transaction History Table */}
        <Card className="border-slate-900 bg-slate-950/50 backdrop-blur shadow-xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-white font-bold">Ledger Transactions</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Organization-scoped real-time audit log of all statement parser output records.
              </CardDescription>
            </div>
            {transactions.length > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20 font-medium self-start sm:self-center">
                {transactions.length} Records Loaded
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-slate-900 overflow-hidden bg-slate-950/60">
              <Table>
                <TableHeader className="bg-slate-950/90 border-slate-900">
                  <TableRow className="hover:bg-transparent border-slate-900">
                    <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase py-4">Transaction Date</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase py-4">Description</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase py-4">Parsed Amount</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase py-4">Running Balance</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase py-4 text-center">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow className="border-transparent hover:bg-transparent">
                      <TableCell colSpan={5} className="text-center py-16 text-slate-500 text-sm">
                        No transaction records in this organization workspace.<br />
                        <span className="text-xs text-slate-600">Paste bank statement text blocks in the Parser Console above to begin.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const isCredit = tx.amount >= 0;
                      return (
                        <TableRow key={tx.id} className="border-slate-900/60 hover:bg-slate-900/20 transition-colors">
                          <TableCell className="font-mono text-xs text-slate-400 py-4">
                            {new Date(tx.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="font-medium text-slate-200 py-4">
                            {tx.description}
                          </TableCell>
                          <TableCell className="font-mono py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isCredit 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {isCredit ? "+" : ""}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-slate-300 py-4">
                            {tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-md font-medium ${
                                tx.confidence >= 0.8
                                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                  : tx.confidence >= 0.5
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {(tx.confidence * 100).toFixed(0)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {nextCursor && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => fetchTransactions(nextCursor)}
                  disabled={fetchingTransactions}
                  variant="outline"
                  className="border-slate-800 bg-[#0c0f1b] text-slate-300 hover:bg-slate-900 hover:text-white min-w-36 transition-all"
                >
                  {fetchingTransactions ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More Records"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
