"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balanceAfter: number;
  confidence: number;
  rawText: string;
}

export default function Home() {
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
        // Reload list to include the newly added item at the top
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
    signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            LedgerLens
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
            Multi-Tenant
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{session?.user?.name}</p>
            <p className="text-xs text-slate-500">{session?.user?.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-950/40 backdrop-blur shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-slate-100">Parse Bank Statement</CardTitle>
                <CardDescription className="text-slate-400">
                  Paste a raw, single-line or multi-line bank statement text to extract and record the transaction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleParse} className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="e.g. 11 Dec 2025 Transfer to John ₹1,250.00 debited Balance ₹5,000.00"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-32 border-slate-800 bg-slate-900/40 text-slate-100 placeholder:text-slate-600 focus-visible:ring-violet-500"
                    />
                  </div>
                  {feedback && (
                    <div
                      className={`rounded-lg p-3 text-sm border ${
                        feedback.type === "success"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {feedback.message}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-medium shadow-md shadow-violet-500/20"
                    disabled={loading || !text.trim()}
                  >
                    {loading ? "Parsing & Saving..." : "Parse & Save"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Helper / Test Panel */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-950/40 backdrop-blur shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg text-slate-200">Sample Statement Formats</CardTitle>
                <CardDescription className="text-slate-400">
                  Click any sample format to load it into the input area.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleTexts.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setText(sample);
                      setFeedback(null);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 hover:border-slate-800 transition text-xs font-mono text-slate-400 hover:text-slate-200"
                  >
                    <span className="block font-semibold text-blue-400 mb-1">Format {idx + 1}:</span>
                    {sample}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ledger Table Section */}
        <Card className="border-slate-800 bg-slate-950/40 backdrop-blur shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-100">Transaction Ledger</CardTitle>
              <CardDescription className="text-slate-400">
                A paginated, organization-scoped history of your parsed statement records.
              </CardDescription>
            </div>
            {transactions.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {transactions.length} items loaded
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-slate-900 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-950">
                  <TableRow className="hover:bg-slate-950 border-slate-900">
                    <TableHead className="text-slate-400">Date</TableHead>
                    <TableHead className="text-slate-400">Description</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-400">Balance</TableHead>
                    <TableHead className="text-slate-400 text-center">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow className="border-slate-900 hover:bg-transparent">
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                        No transactions found. Parse your first bank statement above to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const isCredit = tx.amount >= 0;
                      return (
                        <TableRow key={tx.id} className="border-slate-900 hover:bg-slate-900/30">
                          <TableCell className="font-mono text-xs text-slate-400">
                            {new Date(tx.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium text-slate-200">
                            {tx.description}
                          </TableCell>
                          <TableCell className="font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isCredit 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {isCredit ? "+" : ""}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-slate-300">
                            {tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                tx.confidence >= 0.8
                                  ? "bg-blue-500/10 text-blue-400"
                                  : tx.confidence >= 0.5
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-red-500/10 text-red-400"
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
                  className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white min-w-32"
                >
                  {fetchingTransactions ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
