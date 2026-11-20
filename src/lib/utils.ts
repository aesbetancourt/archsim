export { cn } from "cn";

export const PERCENT = 100;

// A fraction from 0 to 1 as a CSS percentage, for example 0.25 as "25%".
export function cssPercent(fraction: number): string {
  return `${fraction * PERCENT}%`;
}
