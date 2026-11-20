export { cn } from "cn";

/** The number to multiply a fraction by to get a percentage. */
export const PERCENT = 100;

/**
 * Write a fraction from 0 to 1 as a CSS percentage.
 * @param fraction The fraction, from 0 to 1.
 * @returns The percentage with a "%" sign.
 * @example
 * cssPercent(0.25); // "25%"
 */
export function cssPercent(fraction: number): string {
  return `${fraction * PERCENT}%`;
}
