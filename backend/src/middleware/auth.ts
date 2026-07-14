import { MiddlewareHandler } from "hono";
import { auth } from "../auth";

export type AuthVariables = {
  userId: string;
  orgId: string;
};

export const authMiddleware: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.session || !session.user) {
      return c.json({ error: "Unauthorized: Invalid or missing session" }, 401);
    }

    const orgId = (session.session as any).activeOrganizationId;
    if (!orgId) {
      return c.json({ error: "Unauthorized: No active organization context found" }, 401);
    }

    c.set("userId", session.user.id);
    c.set("orgId", orgId);

    await next();
  } catch (err: any) {
    return c.json({ error: "Unauthorized: Session verification failed" }, 401);
  }
};
