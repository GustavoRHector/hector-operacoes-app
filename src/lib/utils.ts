import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combina classes CSS sem duplicar regras conflitantes do Tailwind.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Converte um timestamp do banco para o formato "YYYY-MM-DDTHH:MM" que o
// input datetime-local espera, sempre no fuso de São Paulo, para que o
// horário exibido na edição seja o mesmo informado pela equipe.
export function toDateTimeLocalBR(iso: string | null) {
  if (!iso) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(iso));

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
