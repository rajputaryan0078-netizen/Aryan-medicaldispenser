import QRCode from "qrcode";

/**
 * Generate a unique Transaction ID
 */
export function generateTransactionId(): string {
  const ts = Date.now().toString().slice(-8);
  const rnd = Math.floor(Math.random() * 9000 + 1000).toString();
  return `NDX-${ts}-${rnd}`;
}

/**
 * Dummy QR Link
 * QR scan karega to Payment Page open hogi
 */
export function buildUpiLink(
  amountINR: number,
  transactionId: string
): string {
  return `https://aryan-medicaldispenser.vercel.app/pay?txn=${transactionId}&amount=${amountINR}`;
}

/**
 * Generate QR Image
 */
export async function generateUpiQrDataUrl(
  amountINR: number,
  transactionId: string
): Promise<string> {

  const qrLink = buildUpiLink(amountINR, transactionId);

  return await QRCode.toDataURL(qrLink, {
    width: 220,
    margin: 2,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}