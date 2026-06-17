"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toDateKeyBR, toTimeBR } from "@/lib/utils";

// Evento já achatado para exibição; source diferencia interno x Google e
// link/external definem para onde o clique leva (detalhe interno ou Google).
export type CalendarDisplayEvent = {
  id: string;
  title: string;
  starts_at: string;
  source: "internal" | "google";
  link: string;
  external: boolean;
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const weekdayFull = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
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

const pad = (n: number) => String(n).padStart(2, "0");

// Operações sobre chaves de data "YYYY-MM-DD" tratadas como datas de calendário
// puras (UTC ao meio-dia evita saltos por fuso/horário de verão).
function partsOf(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}
function addDays(key: string, days: number) {
  const { y, m, d } = partsOf(key);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function addMonths(key: string, n: number) {
  const { y, m } = partsOf(key);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}-01`;
}
function weekdayOf(key: string) {
  const { y, m, d } = partsOf(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

type View = "month" | "week" | "day";

// Pílula de um evento; abre o detalhe interno ou o Google em nova aba.
function EventChip({ event }: { event: CalendarDisplayEvent }) {
  const tone =
    event.source === "google"
      ? "bg-celeste/25 text-white hover:bg-celeste/40"
      : "bg-white/15 text-white hover:bg-white/25";
  const cls = `block truncate rounded px-1.5 py-0.5 text-[11px] font-medium transition ${tone}`;
  const label = `${toTimeBR(event.starts_at)} ${event.title}`;

  if (event.external) {
    return (
      <a className={cls} href={event.link} rel="noopener noreferrer" target="_blank" title={`Google: ${event.title}`}>
        {label}
      </a>
    );
  }
  return (
    <Link className={cls} href={event.link} title={event.title}>
      {label}
    </Link>
  );
}

// Calendário com visões de mês, semana e dia. Navegação local (sem recarregar):
// os eventos já vêm carregados e a troca apenas re-filtra o período exibido.
export function CalendarView({
  events,
  initialCursor,
  todayKey
}: {
  events: CalendarDisplayEvent[];
  initialCursor: string; // chave "YYYY-MM-DD" do dia atual
  todayKey: string;
}) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(initialCursor);

  // Agrupa os eventos por dia (chave SP) e ordena por horário dentro do dia.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarDisplayEvent[]>();
    for (const event of events) {
      const key = toDateKeyBR(event.starts_at);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }
    return map;
  }, [events]);

  const go = (dir: number) =>
    setCursor((c) => (view === "month" ? addMonths(c, dir) : view === "week" ? addDays(c, dir * 7) : addDays(c, dir)));

  const goToday = () => setCursor(todayKey);

  // Título conforme a visão.
  const { y, m, d } = partsOf(cursor);
  let title: string;
  if (view === "month") {
    title = `${monthLabels[m - 1]} de ${y}`;
  } else if (view === "week") {
    const start = addDays(cursor, -weekdayOf(cursor));
    const end = addDays(start, 6);
    const s = partsOf(start);
    const e = partsOf(end);
    title =
      s.m === e.m
        ? `${s.d}–${e.d} de ${monthLabels[s.m - 1]} de ${e.y}`
        : `${s.d}/${pad(s.m)} – ${e.d}/${pad(e.m)} de ${e.y}`;
  } else {
    title = `${weekdayFull[weekdayOf(cursor)]}, ${d} de ${monthLabels[m - 1]} de ${y}`;
  }

  const viewButton = (value: View, label: string) => (
    <button
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        view === value ? "bg-white text-blu" : "text-moss hover:text-ink"
      }`}
      onClick={() => setView(value)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <section className="glass-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
            onClick={() => go(-1)}
            type="button"
          >
            ‹
          </button>
          <button
            className="glass-input rounded-md px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-mist"
            onClick={goToday}
            type="button"
          >
            Hoje
          </button>
          <button
            className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
            onClick={() => go(1)}
            type="button"
          >
            ›
          </button>
        </div>

        <h2 className="text-lg font-semibold text-ink">{title}</h2>

        <div className="glass-chip flex items-center gap-1 rounded-md p-1">
          {viewButton("month", "Mês")}
          {viewButton("week", "Semana")}
          {viewButton("day", "Dia")}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-moss">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-white/25" /> Interno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-celeste/50" /> Google
        </span>
      </div>

      {view === "month" ? (
        <MonthGrid cursor={cursor} eventsByDay={eventsByDay} todayKey={todayKey} />
      ) : view === "week" ? (
        <WeekGrid cursor={cursor} eventsByDay={eventsByDay} todayKey={todayKey} />
      ) : (
        <DayList cursor={cursor} eventsByDay={eventsByDay} todayKey={todayKey} />
      )}
    </section>
  );
}

type GridProps = {
  cursor: string;
  eventsByDay: Map<string, CalendarDisplayEvent[]>;
  todayKey: string;
};

// Grade do mês inteiro.
function MonthGrid({ cursor, eventsByDay, todayKey }: GridProps) {
  const { y, m } = partsOf(cursor);
  const firstWeekday = weekdayOf(`${y}-${pad(m)}-01`);
  const daysInMonth = new Date(y, m, 0).getDate();

  const cells: Array<string | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(`${y}-${pad(m)}-${pad(day)}`);

  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-moss">
        {weekdayLabels.map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((key, index) => {
          if (!key) return <div className="min-h-20 rounded-md bg-mist/40" key={`empty-${index}`} />;
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              className={`min-h-20 rounded-md border p-1 text-left ${
                isToday ? "border-ambered bg-ambered/10" : "border-moss/10"
              }`}
              key={key}
            >
              <span className={`text-xs font-semibold ${isToday ? "text-ink" : "text-moss"}`}>
                {partsOf(key).d}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) => (
                  <EventChip event={event} key={`${event.source}-${event.id}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Visão de semana: 7 colunas com os eventos de cada dia.
function WeekGrid({ cursor, eventsByDay, todayKey }: GridProps) {
  const start = addDays(cursor, -weekdayOf(cursor));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((key) => {
        const dayEvents = eventsByDay.get(key) ?? [];
        const isToday = key === todayKey;
        return (
          <div
            className={`min-h-40 rounded-md border p-1.5 text-left ${
              isToday ? "border-ambered bg-ambered/10" : "border-moss/10"
            }`}
            key={key}
          >
            <p className="text-center text-[11px] font-semibold uppercase text-moss">
              {weekdayLabels[weekdayOf(key)]}
            </p>
            <p className={`text-center text-sm font-semibold ${isToday ? "text-ink" : "text-moss"}`}>
              {partsOf(key).d}
            </p>
            <div className="mt-2 space-y-1">
              {dayEvents.map((event) => (
                <EventChip event={event} key={`${event.source}-${event.id}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Visão de dia: lista cronológica dos compromissos do dia escolhido.
function DayList({ cursor, eventsByDay }: GridProps) {
  const dayEvents = eventsByDay.get(cursor) ?? [];

  if (dayEvents.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-white/20 p-6 text-center text-sm text-moss">
        Sem compromissos neste dia.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {dayEvents.map((event) => {
        const tone = event.source === "google" ? "border-celeste/40 bg-celeste/15" : "border-white/15 bg-white/10";
        const inner = (
          <div className={`flex items-center gap-3 rounded-md border px-3 py-2.5 transition hover:bg-white/15 ${tone}`}>
            <span className="text-sm font-semibold text-ink">{toTimeBR(event.starts_at)}</span>
            <span className="truncate text-sm text-ink">{event.title}</span>
            {event.source === "google" ? (
              <span className="ml-auto text-[11px] uppercase text-celeste">Google</span>
            ) : null}
          </div>
        );
        return event.external ? (
          <a href={event.link} key={`g-${event.id}`} rel="noopener noreferrer" target="_blank">
            {inner}
          </a>
        ) : (
          <Link href={event.link} key={event.id}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
