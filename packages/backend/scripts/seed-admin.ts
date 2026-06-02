import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    console.error("❌ ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME must be set in .env");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin user ${user.email} (id: ${user.id}) — ${user.role}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
