const LAKH = 100_000;
const CRORE = 10_000_000;

function trimDecimals(value: number, maxDecimals: number): string {
  return Number(value.toFixed(maxDecimals)).toString();
}

export interface FormatPriceOptions {
  compact?: boolean;
  period?: "month" | null;
}

/**
 * Formats a price for display. Bangladeshi Taka uses the lakh/crore convention that local
 * buyers expect; other currencies use standard international formatting.
 */
export function formatPrice(
  amount: number,
  currency: string,
  { compact = false, period = null }: FormatPriceOptions = {},
): string {
  const suffix = period === "month" ? " / month" : "";

  if (currency === "BDT") {
    if (compact && amount >= CRORE) return `BDT ${trimDecimals(amount / CRORE, 2)} Crore${suffix}`;
    if (compact && amount >= LAKH) return `BDT ${trimDecimals(amount / LAKH, 1)} Lakh${suffix}`;
    return `BDT ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}${suffix}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact && amount >= 1_000_000 ? 1 : 0,
    notation: compact && amount >= 1_000_000 ? "compact" : "standard",
  }).format(amount);
  return `${formatted}${suffix}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatArea(sqft: number, unit = "sq ft"): string {
  return `${formatNumber(sqft)} ${unit}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(value: Date | string): string {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDateTime(value: Date | string): string {
  return `${dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value)} UTC`;
}

export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
