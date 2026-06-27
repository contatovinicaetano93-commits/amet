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
  multi?: boolean;
  enforceLimit?: boolean;
  showVacancyCount?: boolean;
};

export function AreaCard({
  area,
  selected,
  onSelect,
  enforceLimit,
  showVacancyCount = true,
}: AreaCardProps) {
  const disabled = enforceLimit && area.full;

  const subtitle = !showVacancyCount
    ? "Área de interesse"
    : enforceLimit && area.full
      ? "Vagas Esgotadas"
      : `${area.available} de ${area.limit} vagas disponíveis`;

  const badgeLabel = !showVacancyCount
    ? selected
      ? "Selecionado"
      : "Disponível"
    : enforceLimit && area.full
      ? "Esgotado"
      : selected
        ? "Selecionado"
        : "Aberto";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(area.code)}
      className={`rounded-2xl border p-5 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-amet-indigo/10 bg-amet-indigo/[0.03] opacity-60"
          : selected
            ? "border-amet-purple bg-amet-purple/5 shadow-md shadow-amet-purple/10"
            : "border-amet-blue/15 bg-amet-white hover:border-amet-blue hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tracking-wide text-amet-indigo">{area.label}</p>
          <p className="mt-1 text-sm text-amet-indigo/60">{subtitle}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            enforceLimit && area.full
              ? "bg-amet-purple/10 text-amet-purple"
              : selected
                ? "bg-amet-blue/10 text-amet-blue"
                : "bg-amet-indigo/5 text-amet-indigo"
          }`}
        >
          {badgeLabel}
        </span>
      </div>
    </button>
  );
}
