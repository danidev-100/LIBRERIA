import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from CWD (expected: packages/backend/.env)
dotenv.config();

import { parsePriceList } from "../packages/backend/src/lib/parse-price-list.js";
import { prisma } from "../packages/backend/src/lib/prisma.js";

const BATCH_SIZE = 500;

const __dirname = dirname(fileURLToPath(import.meta.url));

function getTxtPath(): string {
  if (process.env.PRICE_LIST_PATH) {
    return resolve(process.cwd(), process.env.PRICE_LIST_PATH);
  }
  // Default: resolve relative to this script's location
  return resolve(__dirname, "..", "LISTA_ACTUALIZADA_26052026.txt");
}

async function main(): Promise<void> {
  const startTime = Date.now();

  // ── Validate TXT file ──────────────────────────────────────────────
  const txtPath = getTxtPath();
  if (!existsSync(txtPath)) {
    console.error(`✖ TXT file not found at: ${txtPath}`);
    console.error("  Place LISTA_ACTUALIZADA_26052026.txt in the project root");
    console.error("  or set PRICE_LIST_PATH env var to the correct path.");
    process.exit(1);
  }

  // ── Parse ──────────────────────────────────────────────────────────
  console.log(`📖 Reading price list from: ${txtPath}`);
  const products = parsePriceList(txtPath);
  console.log(`  ✓ Parsed ${products.length} products from TXT`);

  // ── Database ───────────────────────────────────────────────────────
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("✖ DATABASE_URL is not set.");
    console.error("  Ensure .env exists in packages/backend/ or set it as an env var.");
    process.exit(1);
  }

  console.log("🔌 Connecting to database...");

  try {
    await prisma.$connect();
    console.log("  ✓ Connected");

    // ── Batch insert ─────────────────────────────────────────────────
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);
    let insertedTotal = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      const data = batch.map((p) => ({
        code: p.code,
        description: p.description,
        price: p.price,
        isActive: p.isActive,
        lastUpdate: p.lastUpdate,
      }));

      const result = await prisma.product.createMany({
        data,
        skipDuplicates: true,
      });

      insertedTotal += result.count;
      console.log(
        `  Batch ${batchNum}/${totalBatches} → ${result.count} products inserted (total: ${insertedTotal})`,
      );
    }

    // ── Summary ──────────────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const skipped = products.length - insertedTotal;

    console.log("\n═══════════════════════════════════════");
    console.log("  ✅ Seed complete!");
    console.log(`  📦 Total products parsed:   ${products.length}`);
    console.log(`  📥 Products inserted:       ${insertedTotal}`);
    console.log(`  ⏭  Skipped (duplicates):    ${skipped}`);
    console.log(`  ⏱  Elapsed time:            ${elapsed}s`);
    console.log("═══════════════════════════════════════");
  } catch (err) {
    console.error("\n✖ Database error during seed:");
    if (err instanceof Error) {
      console.error(`  ${err.message}`);
      console.error(`  Connection: ${dbUrl.replace(/\/\/.*@/, "//user:pass@")}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
