"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toDateKeyBR, toTimeBR } from "@/lib/utils";

// Evento já achatado para exibição na grade; source diferencia interno x Google.
export type CalendarDisplayEvent = {
  id: string;
  title: string;
  starts_at: string;
  source: "internal" | "google";
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

// Exibe os compromissos do mês em grade, agrupados por dia (fuso de São Paulo).
// A navegação de mês é local (sem recarregar a página): os eventos já chegam
// carregados e a troca apenas filtra o mês exibido no próprio navegador.
export function CalendarMonth({
  events,
  initialYear,
  initialMonth,
  todayKey
}: {
  events: CalendarDisplayEvent[];
  initialYear: number;
  initialMonth: number; // 1-12
  todayKey: string;
}) {
  const [view, setView] = useState({ year: initialYear, month: initialMonth });
  const { year, month } = view;

  // Agrupa os eventos por dia uma única vez para montar a grade.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarDisplayEvent[]>();
    for (const event of events) {
      const key = toDateKeyBR(event.starts_at);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = domingo
  const daysInMonth = new Date(year, month, 0).getDate();

  // Monta a sequência de células: espaços em branco antes do dia 1 e os dias do mês.
  const cells: Array<{ day: number; key: string } | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, key });
  }

  const goPrev = () =>
    setView((v) => (v.month === 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: v.month - 1 }));
  const goNext = () =>
    setView((v) => (v.month === 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: v.month + 1 }));

  return (
    <section className="glass-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
          onClick={goPrev}
          type="button"
        >
          ‹ Anterior
        </button>
        <h2 className="text-lg font-semibold text-ink">
          {monthLabels[month - 1]} de {year}
        </h2>
        <button
          className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
          onClick={goNext}
          type="button"
        >
          Próximo ›
        </button>
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-moss">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-white/25" /> Interno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-celeste/50" /> Google
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-moss">
        {weekdayLabels.map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div className="min-h-20 rounded-md bg-mist/40" key={`empty-${index}`} />;
          }

          const dayEvents = eventsByDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;

          return (
            <div
              className={`min-h-20 rounded-md border p-1 text-left ${
                isToday ? "border-ambered bg-ambered/10" : "border-moss/10"
              }`}
              key={cell.key}
            >
              <span className={`text-xs font-semibold ${isToday ? "text-ink" : "text-moss"}`}>
                {cell.day}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) =>
                  event.source === "google" ? (
                    // Eventos do Google são apenas exibidos (não editáveis aqui).
                    <span
                      className="block truncate rounded bg-celeste/25 px-1.5 py-0.5 text-[11px] font-medium text-white"
                      key={`g-${event.id}`}
                      title={`Google: ${event.title}`}
                    >
                      {toTimeBR(event.starts_at)} {event.title}
                    </span>
                  ) : (
                    <Link
                      className="block truncate rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-medium text-white transition hover:bg-white/25"
                      href={`/agenda/${event.id}`}
                      key={event.id}
                      title={event.title}
                    >
                      {toTimeBR(event.starts_at)} {event.title}
                    </Link>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
