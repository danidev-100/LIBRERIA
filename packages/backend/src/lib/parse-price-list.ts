import { readFileSync } from "node:fs";

export interface ParsedProduct {
  /** 8-digit product code */
  code: string;
  /** Cleaned description (trailing `*` removed) */
  description: string;
  /** Parsed price, 0 if the field was blank */
  price: number;
  /** Parsed last-update date, null if invalid or empty */
  lastUpdate: Date | null;
  /** Always true for parsed products */
  isActive: boolean;
}

const SKIP_PATTERNS = [
  "LISTA DE PRECIOS",
  "Pag.",
  "Codigo",
  "==========",
  "Valor:Lista",
] as const;

/**
 * Parse a fixed-width TXT price list (ISO-8859-1 / latin1 encoded).
 *
 * Field positions (0-indexed):
 *   code:        slice(10, 18)
 *   description: slice(20, 67)
 *   price:       slice(68, 76)
 *   lastUpdate:  slice(78, 88)
 *
 * @param filePath Absolute or relative path to the TXT file.
 * @returns An array of parsed products.
 */
export function parsePriceList(filePath: string): ParsedProduct[] {
  const buffer = readFileSync(filePath);
  const decoder = new TextDecoder("latin1");
  const content = decoder.decode(buffer);

  const lines = content.split(/\r?\n/);
  const products: ParsedProduct[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip blank lines
    if (line.length === 0) continue;

    // Skip form-feed characters
    if (line.includes("\f")) continue;

    // Skip header / separator lines
    const trimmed = line.trim();
    if (SKIP_PATTERNS.some((p) => trimmed.includes(p))) continue;

    // Must be long enough to contain a code + at least start of description
    if (line.length < 20) continue;

    const code = line.slice(10, 18).trim();
    if (code.length === 0) continue;

    // Description: positions 20–66, strip trailing asterisks
    const description =
      line.length >= 67
        ? line.slice(20, 67).trim().replace(/\*+$/, "").trimEnd()
        : "";

    // Price: positions 68–75
    const priceStr = line.length >= 76 ? line.slice(68, 76).trim() : "";
    const price = priceStr === "" ? 0 : Number.parseFloat(priceStr);

    // Last update: positions 78–87, DD/MM/YYYY
    const dateStr = line.length >= 88 ? line.slice(78, 88).trim() : "";
    let lastUpdate: Date | null = null;
    if (dateStr.length > 0) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1; // 0-indexed
        const year = Number.parseInt(parts[2], 10);
        if (
          !Number.isNaN(day) &&
          !Number.isNaN(month) &&
          !Number.isNaN(year)
        ) {
          lastUpdate = new Date(year, month, day);
        }
      }
    }

    products.push({ code, description, price, lastUpdate, isActive: true });
  }

  return products;
}
