"use client";

import { useState } from "react";
import { createCalendarEventAction } from "@/app/(app)/agenda/actions";

type ProfileOption = {
  id: string;
  full_name: string;
};

// Opções de cor (apenas visual no app). Leve = verde, Médio = amarelo, Alta = vermelho.
const colorOptions = [
  { value: "green", label: "Leve", dot: "bg-magic-green" },
  { value: "yellow", label: "Médio", dot: "bg-magic-amber" },
  { value: "red", label: "Alta", dot: "bg-magic-red" }
] as const;

// Horários em incrementos fechados de 30 minutos (00:00, 00:30, ... 23:30).
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

// Junta data e hora num valor "YYYY-MM-DDTHH:MM" que a action já entende.
function joinDateTime(date: string, time: string) {
  return date && time ? `${date}T${time}` : "";
}

// Cadastro de compromisso: data e hora separadas, replicação de data+hora no fim
// e escolha de cor. A escrita continua na action segura do servidor.
export function CalendarCreateForm({ profiles }: { profiles: ProfileOption[] }) {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState<string>("green");

  // Ao escolher a data de início, replica na data de fim (pode ajustar depois).
  const onStartDateChange = (value: string) => {
    setStartDate(value);
    setEndDate(value);
  };
  // Ao escolher a hora de início, replica na hora de fim.
  const onStartTimeChange = (value: string) => {
    setStartTime(value);
    setEndTime(value);
  };

  return (
    <form action={createCalendarEventAction} className="glass-card p-4">
      {/* Valores combinados enviados à action; os campos visíveis só guiam o estado. */}
      <input name="starts_at" type="hidden" value={joinDateTime(startDate, startTime)} />
      <input name="ends_at" type="hidden" value={joinDateTime(endDate, endTime)} />
      <input name="color" type="hidden" value={color} />

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Título</span>
          <input
            className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="title"
            maxLength={140}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Tipo</span>
          <select className="w-full glass-input rounded-md px-3 py-2" name="event_type">
            <option>Compromisso</option>
            <option>Reunião</option>
            <option>Prazo</option>
            <option>Renovação</option>
            <option>Visita</option>
          </select>
        </label>

        <div className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Início</span>
          <div className="flex gap-2">
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              onChange={(e) => onStartDateChange(e.target.value)}
              required
              type="date"
              value={startDate}
            />
            <select
              className="w-32 glass-input rounded-md px-3 py-2"
              onChange={(e) => onStartTimeChange(e.target.value)}
              required
              value={startTime}
            >
              <option value="">Hora</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Fim</span>
          <div className="flex gap-2">
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              onChange={(e) => setEndDate(e.target.value)}
              type="date"
              value={endDate}
            />
            <select
              className="w-32 glass-input rounded-md px-3 py-2"
              onChange={(e) => setEndTime(e.target.value)}
              value={endTime}
            >
              <option value="">Hora</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Responsável</span>
          <select className="w-full glass-input rounded-md px-3 py-2" name="responsible_id">
            <option value="">Usuário atual</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name}
              </option>
            ))}
          </select>
        </label>

        <div className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Prioridade (cor)</span>
          <div className="flex gap-2">
            {colorOptions.map((opt) => (
              <button
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  color === opt.value ? "bg-white text-blu" : "glass-input text-ink"
                }`}
                key={opt.value}
                onClick={() => setColor(opt.value)}
                type="button"
              >
                <span className={`h-3 w-3 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Descrição</span>
          <textarea className="min-h-20 w-full glass-input rounded-md px-3 py-2" name="description" maxLength={1200} />
        </label>
      </div>

      <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
        Criar compromisso
      </button>
    </form>
  );
}
