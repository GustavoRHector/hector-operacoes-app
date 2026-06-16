import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combina classes CSS sem duplicar regras conflitantes do Tailwind.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
