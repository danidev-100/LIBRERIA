import PDFDocument from "pdfkit";

export interface InvoiceOrderData {
  id: number;
  createdAt: Date;
  status: string;
  total: number | { toNumber(): number };
  user: { name: string; email: string };
  items: Array<{
    productCode: string;
    quantity: number;
    unitPrice: number | { toNumber(): number };
    product: { code: string; description: string; price: number | { toNumber(): number } };
  }>;
}

/**
 * Generates a PDF invoice buffer for an order.
 * Uses pdfkit with built-in Helvetica fonts (supports latin chars).
 */
export function generateOrderInvoice(order: InvoiceOrderData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const toNum = (v: number | { toNumber(): number }): number =>
      typeof v === "number" ? v : v.toNumber();

    const orderDate =
      order.createdAt instanceof Date
        ? order.createdAt.toISOString().split("T")[0]
        : String(order.createdAt).split("T")[0];

    // --- Header ---
    doc.fontSize(24).font("Helvetica-Bold").text("LIBRERIA", 50, 50);
    doc.fontSize(12).font("Helvetica");
    doc.text(`Orden #${order.id}`, 50, 85);
    doc.text(`Fecha: ${orderDate}`, 50, 100);

    drawLine(doc, 118);

    // --- Customer ---
    doc.fontSize(14).font("Helvetica-Bold").text("Cliente", 50, 130);
    doc.fontSize(12).font("Helvetica");
    doc.text(`Nombre: ${order.user.name}`, 50, 150);
    doc.text(`Email: ${order.user.email}`, 50, 165);

    drawLine(doc, 185);

    // --- Items Table ---
    const colX = { code: 50, desc: 110, qty: 380, price: 430, subtotal: 490 };
    const colW = { desc: 260, qty: 40, price: 55, subtotal: 55 };

    const tableHeaderY = 200;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Código", colX.code, tableHeaderY);
    doc.text("Descripción", colX.desc, tableHeaderY, { width: colW.desc });
    doc.text("Cant.", colX.qty, tableHeaderY, { width: colW.qty, align: "center" });
    doc.text("P.Unit", colX.price, tableHeaderY, { width: colW.price, align: "right" });
    doc.text("Subtotal", colX.subtotal, tableHeaderY, { width: colW.subtotal, align: "right" });

    drawLine(doc, 215);

    // --- Rows ---
    let y = 225;
    doc.font("Helvetica").fontSize(10);

    for (const item of order.items) {
      const up = toNum(item.unitPrice);
      const subtotal = up * item.quantity;

      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      doc.text(item.productCode, colX.code, y);
      doc.text(item.product.description, colX.desc, y, { width: colW.desc });
      doc.text(String(item.quantity), colX.qty, y, { width: colW.qty, align: "center" });
      doc.text(`$${up.toFixed(2)}`, colX.price, y, { width: colW.price, align: "right" });
      doc.text(`$${subtotal.toFixed(2)}`, colX.subtotal, y, { width: colW.subtotal, align: "right" });

      y += 20;
    }

    // --- Total ---
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).stroke();
    y += 12;

    const totalNum = toNum(order.total);
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("TOTAL:", colX.price, y, { width: colW.price, align: "right" });
    doc.text(`$${totalNum.toFixed(2)}`, colX.subtotal, y, { width: colW.subtotal, align: "right" });

    // --- Footer ---
    y += 40;
    doc.fontSize(10).font("Helvetica");
    doc.text(`Estado: ${order.status}`, 50, y, { align: "center" });
    doc.fontSize(8);
    doc.text(`Generado: ${new Date().toISOString()}`, 50, y + 15, { align: "center" });

    doc.end();
  });
}

function drawLine(doc: PDFKit.PDFDocument, y: number) {
  doc.moveTo(50, y).lineTo(545, y).stroke();
}
