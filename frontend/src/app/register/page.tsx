"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      // 1. Call Backend Registration Endpoint
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed. Try a different email.");
      }

      // 2. Automate Sign-in on Success
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created, but automatic sign-in failed. Please login manually.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      <Card className="relative w-full max-w-md border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-400">
            Sign up to get your own transaction ledger
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder:text-slate-600 focus-visible:ring-violet-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder:text-slate-600 focus-visible:ring-violet-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder:text-slate-600 focus-visible:ring-violet-500"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-medium shadow-md shadow-violet-500/20"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
