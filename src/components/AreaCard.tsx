"use client";

import type { AreaCode } from "@/lib/constants";

export type VacancyInfo = {
  code: AreaCode;
  label: string;
  limit: number;
  used: number;
  available: number;
  full: boolean;
};

type AreaCardProps = {
  area: VacancyInfo;
  selected: boolean;
  onSelect: (code: AreaCode) => void;
};

export function AreaCard({ area, selected, onSelect }: AreaCardProps) {
  const disabled = area.full;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(area.code)}
      className={`rounded-2xl border p-5 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-amet-white/20 bg-amet-white/5 opacity-60"
          : selected
            ? "border-amet-purple bg-amet-purple/15 shadow-lg shadow-amet-purple/20"
            : "border-amet-white/20 bg-amet-white/5 hover:border-amet-blue hover:bg-amet-blue/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tracking-wide text-amet-white">{area.label}</p>
          <p className="mt-1 text-sm text-amet-white/70">
            {area.full
              ? "Vagas Esgotadas"
              : `${area.available} de ${area.limit} vagas disponíveis`}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            area.full
              ? "bg-amet-purple/25 text-amet-purple"
              : selected
                ? "bg-amet-blue/25 text-amet-blue"
                : "bg-amet-white/10 text-amet-white"
          }`}
        >
          {area.full ? "Esgotado" : "Aberto"}
        </span>
      </div>
    </button>
  );
}
