import { MiddlewareHandler } from "hono";
import { auth } from "../auth";
import { prisma } from "../db";

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

    const userId = session.user.id;
    let orgId = (session.session as any).activeOrganizationId;

    if (!orgId) {
      // Fallback: Resolve organization from membership if session activeOrganizationId is null
      const membership = await prisma.membership.findFirst({
        where: { userId },
      });
      if (membership) {
        orgId = membership.organizationId;
        // Self-heal: update the session in the database so subsequent hits are cached
        await prisma.session.update({
          where: { id: (session.session as any).id },
          data: { activeOrganizationId: orgId },
        });
      }
    }

    if (!orgId) {
      return c.json({ error: "Unauthorized: No active organization context found" }, 401);
    }

    c.set("userId", userId);
    c.set("orgId", orgId);

    await next();
  } catch (err: any) {
    return c.json({ error: "Unauthorized: Session verification failed" }, 401);
  }
};
