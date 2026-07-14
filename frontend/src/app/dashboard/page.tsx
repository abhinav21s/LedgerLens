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
    { label: "Simple format", text: "11 Dec 2025 Transfer to John ₹1,250.00 debited Balance ₹5,000.00" },
    { label: "Slash-date format", text: "12/11/2025 Groceries Store ₹2,999.00 Dr Balance ₹2,001.00" },
    { label: "Messy/no-punctuation format", text: "2025-12-10 Salary -420.00 Balance 12458.73" },
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
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Syncing secure ledger session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Navigation bar */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            LL
          </div>
          <span className="text-xl font-heading font-bold tracking-tight text-foreground">
            LedgerLens
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block border-r border-border pr-4 mr-2">
            <p className="text-sm font-medium text-foreground">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{(session as any).orgId ? `Org ${(session as any).orgId.substring(0, 8)}...` : 'Personal'}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-border bg-card text-foreground hover:bg-secondary hover:text-foreground flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* KPI Cards / Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-border bg-card shadow-lg relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary" />
            <CardContent className="pt-5 pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Ledger Count</p>
                <p className="text-3xl font-heading font-bold text-foreground">{transactions.length}</p>
              </div>
              <History className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-lg relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary" />
            <CardContent className="pt-5 pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Engine Confidence</p>
                <p className="text-3xl font-heading font-bold text-foreground font-mono">{avgConfidence.toFixed(0)}%</p>
              </div>
              <FileText className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-lg relative overflow-hidden group">
            <CardContent className="pt-5 pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Database Status</p>
                <p className="text-3xl font-heading font-bold text-foreground">Active</p>
              </div>
              <Database className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            </CardContent>
          </Card>
        </div>

        {/* Visual Section Divider */}
        <div className="border-t border-border"></div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Parser Engine Console - Primary Element with Visual Emphasis */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border-primary/40 bg-card shadow-xl ring-1 ring-primary/10">
              <CardHeader className="flex flex-row items-center space-x-3 pb-4">
                <FileText className="h-5 w-5 text-primary" strokeWidth={2} />
                <div>
                  <CardTitle className="text-lg font-heading font-semibold text-foreground">Parser Console</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs mt-1">
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
                      className="min-h-36 border-2 border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary font-mono text-sm transition-all"
                    />
                  </div>

                  {feedback && (
                    <div
                      className={`rounded-lg p-3 text-sm border flex items-start gap-2.5 ${
                        feedback.type === "success"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
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
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide py-5 flex items-center justify-center gap-2 transition-all duration-300"
                    disabled={loading || !text.trim()}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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

          {/* Test Presets Console - Secondary Helper */}
          <div>
            <Card className="border-border bg-card shadow-lg h-full">
              <CardHeader className="flex flex-row items-center space-x-3 pb-4">
                <Database className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                <div>
                  <CardTitle className="text-lg font-heading font-semibold text-foreground">Try a Sample Statement</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs mt-1">
                    Click any example to auto-fill the parser console and test instantly.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleTexts.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setText(sample.text);
                      setFeedback(null);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 border-border bg-background hover:bg-secondary hover:border-primary/40 transition-all duration-300 group"
                  >
                    <span className="block font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                      {sample.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                      {sample.text}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Visual Section Divider */}
        <div className="border-t border-border"></div>

        {/* Ledger Transaction History Table */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg font-heading font-semibold text-foreground">Ledger Transactions</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-1">
                Organization-scoped real-time audit log of all statement parser output records.
              </CardDescription>
            </div>
            {transactions.length > 0 && (
              <span className="text-xs font-mono px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium self-start sm:self-center">
                {transactions.length} Records
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-secondary border-border">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground font-medium text-xs tracking-wide py-3">Transaction Date</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs tracking-wide py-3">Description</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs tracking-wide py-3">Parsed Amount</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs tracking-wide py-3">Running Balance</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs tracking-wide py-3 text-center">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow className="border-transparent hover:bg-transparent">
                      <TableCell colSpan={5} className="text-center py-16 text-muted-foreground text-sm">
                        No transaction records in this organization workspace.<br />
                        <span className="text-xs">Paste bank statement text blocks in the Parser Console above to begin.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const isCredit = tx.amount >= 0;
                      return (
                        <TableRow key={tx.id} className="border-border hover:bg-secondary/50 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground py-3">
                            {new Date(tx.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="font-medium text-foreground py-3">
                            {tx.description}
                          </TableCell>
                          <TableCell className="font-mono py-3 text-sm">
                            <span
                              className={`${
                                isCredit 
                                  ? "text-primary" 
                                  : "text-destructive"
                              } font-semibold`}
                            >
                              {isCredit ? "+" : ""}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-foreground py-3 text-sm">
                            {tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <span
                              className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${
                                tx.confidence >= 0.8
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : tx.confidence >= 0.5
                                  ? "bg-muted text-muted-foreground border border-border"
                                  : "bg-destructive/10 text-destructive border border-destructive/20"
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
                  className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground min-w-36 transition-all"
                >
                  {fetchingTransactions ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent mr-2" />
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
