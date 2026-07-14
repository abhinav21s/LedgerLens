import "dotenv/config";
import app from "./index";
import { prisma } from "./db";

describe("Ledgerlens Integration Tests", () => {
  const emailA = `alice.test.${Math.floor(Math.random() * 100000)}@example.com`;
  const emailB = `bob.test.${Math.floor(Math.random() * 100000)}@example.com`;
  const password = "password123";

  let tokenA = "";
  let tokenB = "";
  let userIdA = "";
  let userIdB = "";
  let orgIdA = "";
  let orgIdB = "";

  afterAll(async () => {
    // Cleanup the created test data to prevent cluttering the database
    await prisma.transaction.deleteMany({
      where: {
        userId: { in: [userIdA, userIdB] },
      },
    });
    await prisma.membership.deleteMany({
      where: {
        userId: { in: [userIdA, userIdB] },
      },
    });
    await prisma.session.deleteMany({
      where: {
        userId: { in: [userIdA, userIdB] },
      },
    });
    await prisma.account.deleteMany({
      where: {
        userId: { in: [userIdA, userIdB] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [userIdA, userIdB] },
      },
    });
    await prisma.$disconnect();
  });

  // Test 1: Successful registration for User A
  it("should successfully register User A", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailA,
        password,
        name: "Test Alice",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(emailA);
    expect(data.token).toBeDefined();
    expect(data.activeOrganizationId).toBeDefined();

    userIdA = data.user.id;
    tokenA = data.token;
    orgIdA = data.activeOrganizationId;
  });

  // Test 1b: Successful registration for User B (to test isolation)
  it("should successfully register User B", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailB,
        password,
        name: "Test Bob",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    userIdB = data.user.id;
    tokenB = data.token;
    orgIdB = data.activeOrganizationId;
  });

  // Test 2: Login returns valid session/JWT (token)
  it("should successfully login User A and return token", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailA,
        password,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user.id).toBe(userIdA);
  });

  // Test 3: Extraction endpoint correctly parses each of the 3 formats
  const formats = [
    {
      text: "11 Dec 2025 Transfer to John ₹1,250.00 debited Balance ₹5,000.00",
      expected: { amount: -1250, balanceAfter: 5000, description: "Transfer to John" },
    },
    {
      text: "12/11/2025 Groceries Store ₹2,999.00 Dr Balance ₹2,001.00",
      expected: { amount: -2999, balanceAfter: 2001, description: "Groceries Store" },
    },
    {
      text: "2025-12-10 Salary -420.00 Balance 12458.73",
      expected: { amount: -420, balanceAfter: 12458.73, description: "Salary" },
    },
  ];

  formats.forEach((f, idx) => {
    it(`should parse statement format ${idx + 1} and save it to the DB`, async () => {
      const res = await app.request("/api/transactions/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ text: f.text }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.amount).toBe(f.expected.amount);
      expect(body.data.balanceAfter).toBe(f.expected.balanceAfter);
      expect(body.data.description).toBe(f.expected.description);
      expect(body.data.confidence).toBe(1.0);
    });
  });

  // Test 4: Unauthenticated request to /api/transactions is rejected
  it("should reject unauthenticated request to list transactions", async () => {
    const res = await app.request("/api/transactions", {
      method: "GET",
    });
    expect(res.status).toBe(401);
  });

  // Test 5: A user from Org A cannot see Org B's transactions even when authenticated
  it("should prevent User B from reading User A's organization transactions", async () => {
    // User B fetches transactions (should see 0)
    const res = await app.request("/api/transactions", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.length).toBe(0);

    // User A fetches transactions (should see 3)
    const resA = await app.request("/api/transactions", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    const bodyA = await resA.json();
    expect(bodyA.data.length).toBe(3);
  });

  // Test 6: Cursor pagination returns correct nextCursor and doesn't skip/duplicate rows
  it("should correctly handle cursor pagination with unique nextCursor and no duplicates", async () => {
    // Fetch first transaction with limit 1
    const res1 = await app.request("/api/transactions?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    expect(res1.status).toBe(200);
    const page1 = await res1.json();
    expect(page1.data.length).toBe(1);
    expect(page1.nextCursor).not.toBeNull();

    const cursor = page1.nextCursor;

    // Fetch next page using the cursor
    const res2 = await app.request(`/api/transactions?limit=1&cursor=${cursor}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    expect(res2.status).toBe(200);
    const page2 = await res2.json();
    expect(page2.data.length).toBe(1);

    // Assert that they are different items (no duplicate)
    expect(page1.data[0].id).not.toBe(page2.data[0].id);
  });
});
