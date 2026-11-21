// Creates (or promotes) a content admin on any database, e.g. production:
//   DATABASE_URL="postgres://…" npm run db:create-admin -- you@school.ng "a-long-password" "Your Name"
// Without a password the account must sign in with Google (same email).
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const [email, password, name = "Admin"] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error('usage: npm run db:create-admin -- <email> [password] ["Name"]');
  process.exit(1);
}
if (password && password.length < 10) {
  console.error("Use a password of at least 10 characters for an admin.");
  process.exit(1);
}

const db = new PrismaClient();
const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
const user = await db.user.upsert({
  where: { email: email.toLowerCase() },
  create: { email: email.toLowerCase(), name, role: "ADMIN", onboarded: true, passwordHash: passwordHash ?? null },
  update: { role: "ADMIN", ...(passwordHash ? { passwordHash } : {}) },
});
console.log(`${user.email} is now an ADMIN. Sign in at /login, then open /admin.`);
await db.$disconnect();
