import { auth } from "./auth";
import { prisma } from "./db";

async function seed() {
  console.log("Seeding database...");

  // Clean existing data (safely in order of dependencies)
  await prisma.transaction.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create User A (hook will automatically create Organization A)
  console.log("Creating User A (Alice)...");
  const userA = await auth.api.signUpEmail({
    body: {
      email: "user.a@example.com",
      password: "password123",
      name: "User Alice",
    },
  });

  // Create User B (hook will automatically create Organization B)
  console.log("Creating User B (Bob)...");
  const userB = await auth.api.signUpEmail({
    body: {
      email: "user.b@example.com",
      password: "password123",
      name: "User Bob",
    },
  });

  console.log("Database seeded successfully!");
  console.log("Test credentials:");
  console.log("- User A: user.a@example.com / password123");
  console.log("- User B: user.b@example.com / password123");
}

seed()
  .catch((err) => {
    console.error("Error seeding database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
