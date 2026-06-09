import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function seedUser(
  role: "ADMIN" | "VIAJANTE",
  emailEnv: string,
  passwordEnv: string,
  nameEnv: string,
) {
  const email = process.env[emailEnv];
  const password = process.env[passwordEnv];
  const name = process.env[nameEnv];

  if (!email || !password || !name) {
    console.log(`⚠️  ${emailEnv} not set — skipping ${role} seed`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role,
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role,
    },
  });

  console.log(`✅ ${role} user ${user.email} (id: ${user.id}) — ${user.role}`);
}

async function main() {
  await seedUser("ADMIN", "ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME");
  await seedUser("VIAJANTE", "VIAJANTE_EMAIL", "VIAJANTE_PASSWORD", "VIAJANTE_NAME");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
