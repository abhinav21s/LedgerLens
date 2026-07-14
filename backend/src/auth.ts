/// <reference types="node" />
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, bearer } from "better-auth/plugins";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 604800, // 7 days in seconds
  },
  plugins: [
    organization({
      // We can map organization or member schema configurations if needed,
      // but since we named the models matching default Prisma Adapter mappings (User, Session, Account, Verification, Organization, Membership),
      // we can map the membership model to our `membership` table:
      schema: {
        member: {
          modelName: "membership",
        }
      }
    }),
    bearer()
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create an organization for the user on sign up
          const orgName = `${user.name || "Personal"}'s Org`;
          const orgSlug = `${user.email.split("@")[0]}-org-${Math.floor(1000 + Math.random() * 9000)}`;

          const org = await prisma.organization.create({
            data: {
              name: orgName,
              slug: orgSlug,
              createdAt: new Date(),
            },
          });

          await prisma.membership.create({
            data: {
              userId: user.id,
              organizationId: org.id,
              role: "owner", // owner role
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Find the user's first membership and set it as the activeOrganizationId in the session
          const membership = await prisma.membership.findFirst({
            where: { userId: session.userId },
          });
          if (membership) {
            return {
              data: {
                ...session,
                activeOrganizationId: membership.organizationId,
              },
            };
          }
        },
      },
    },
  },
});
export type Auth = typeof auth;
