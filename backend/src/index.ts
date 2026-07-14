/// <reference types="node" />
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import process from "process";
import { auth } from "./auth";
import { authMiddleware, AuthVariables } from "./middleware/auth";

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

// Catch-all for Better Auth endpoints (get-session, sign-out, organization APIs etc.)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

const port = Number(process.env.PORT) || 4000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
export default app;
