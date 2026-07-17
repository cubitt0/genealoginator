// Capitalize just the first letter (leaves the rest as-is, so "brat wujeczny" → "Brat wujeczny").
export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
