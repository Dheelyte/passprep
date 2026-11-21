/** Normalise a Nigerian phone number to E.164 (+234XXXXXXXXXX). Returns null if invalid. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let local: string | null = null;
  if (/^\+234\d{10}$/.test(digits)) local = digits.slice(4);
  else if (/^234\d{10}$/.test(digits)) local = digits.slice(3);
  else if (/^0\d{10}$/.test(digits)) local = digits.slice(1);
  if (!local || !/^[789]\d{9}$/.test(local)) return null;
  return `+234${local}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(input: string): string | null {
  const e = input.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

/** Classify a login identifier as email or phone. */
export function parseIdentifier(input: string): { email: string } | { phone: string } | null {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    const email = normalizeEmail(trimmed);
    return email ? { email } : null;
  }
  const phone = normalizePhone(trimmed);
  return phone ? { phone } : null;
}
