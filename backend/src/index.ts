/// <reference types="node" />
import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import process from "process";
import { auth } from "./auth";
import { authMiddleware, AuthVariables } from "./middleware/auth";
import { prisma } from "./db";
import { parseTransactionText } from "./utils/parser";

const app = new Hono<{ Variables: AuthVariables }>();

const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: allowedOrigin,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Explicit registration endpoint
app.post("/api/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const response = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name || body.email.split("@")[0],
      },
      headers: c.req.raw.headers,
      asResponse: true,
    });

    if (response.status === 200) {
      const data = await response.clone().json();
      const membership = await prisma.membership.findFirst({
        where: { userId: data.user.id },
      });

      return c.json({
        user: data.user,
        token: data.token,
        activeOrganizationId: membership?.organizationId || null,
      });
    }
    return response;
  } catch (err: any) {
    return c.json({ error: err.message || "Registration failed" }, 400);
  }
});

// Explicit login endpoint
app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const response = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
      headers: c.req.raw.headers,
      asResponse: true,
    });

    if (response.status === 200) {
      const data = await response.clone().json();
      const membership = await prisma.membership.findFirst({
        where: { userId: data.user.id },
      });

      return c.json({
        user: data.user,
        token: data.token,
        activeOrganizationId: membership?.organizationId || null,
      });
    }
    return response;
  } catch (err: any) {
    return c.json({ error: err.message || "Login failed" }, 400);
  }
});

// Protected routes
app.use("/api/transactions/*", authMiddleware);

app.get("/api/transactions/test", (c) => {
  const userId = c.get("userId");
  const orgId = c.get("orgId");
  return c.json({
    status: "success",
    message: "Authenticated",
    userId,
    orgId,
  });
});

app.post("/api/transactions/extract", async (c) => {
  try {
    const userId = c.get("userId");
    const orgId = c.get("orgId");

    const body = await c.req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return c.json({ error: "Missing or invalid 'text' field in request body" }, 400);
    }

    const parsed = parseTransactionText(text);

    // Save to the database, scoped to orgId and userId
    const transaction = await prisma.transaction.create({
      data: {
        organizationId: orgId,
        userId: userId,
        date: parsed.date,
        description: parsed.description,
        amount: parsed.amount,
        balanceAfter: parsed.balanceAfter,
        rawText: text,
        confidence: parsed.confidence,
      },
    });

    return c.json({
      status: "success",
      data: {
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: Number(transaction.amount),
        balanceAfter: Number(transaction.balanceAfter),
        confidence: transaction.confidence,
        rawText: transaction.rawText,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to extract transaction" }, 500);
  }
});

app.get("/api/transactions", async (c) => {
  try {
    const orgId = c.get("orgId");

    // Parse query params
    const cursor = c.req.query("cursor");
    const limitParam = parseInt(c.req.query("limit") || "20");
    const limit = isNaN(limitParam) ? 20 : limitParam;

    /*
     * WHY CURSOR-BASED PAGINATION?
     * Offset-based pagination (using LIMIT and OFFSET) degrades on large tables because the database must scan
     * and discard OFFSET number of rows before returning results, resulting in O(N) performance.
     * Additionally, if new rows are concurrently inserted or deleted while a user is paginating,
     * offset pagination can cause rows to be skipped or duplicated across pages.
     * Cursor-based pagination uses a stable marker (the cursor, which is typically the unique row ID)
     * and filters rows relative to this marker (e.g., WHERE id < cursor), which utilizes indexes
     * for constant time lookup (O(1)) and remains completely stable regardless of concurrent insertions.
     */
    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
      },
      take: limit + 1,
      orderBy: {
        id: "desc", // Latest transactions first
      },
      ...(cursor
        ? {
            skip: 1, // Skip the cursor element itself
            cursor: {
              id: cursor,
            },
          }
        : {}),
    });

    let nextCursor: string | null = null;
    let data = transactions;

    if (transactions.length > limit) {
      // We have a next page
      const nextItem = transactions[limit];
      nextCursor = nextItem.id;
      // Exclude the extra item from the result
      data = transactions.slice(0, limit);
    }

    const formattedData = data.map((t) => ({
      ...t,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
    }));

    return c.json({
      status: "success",
      data: formattedData,
      nextCursor,
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch transactions" }, 500);
  }
});


// Catch-all for Better Auth endpoints (get-session, sign-out, organization APIs etc.)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

const port = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== "test") {
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
