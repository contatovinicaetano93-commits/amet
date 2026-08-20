import { cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";

export function SummaryItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">{label}</dt>
      <dd className="mt-1 text-sm text-amet-indigo">{value || "—"}</dd>
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
}) {
  const errorId = `${id}-error`;
  return (
    <label className={`block space-y-2 ${className ?? ""}`}>
      <span className="text-sm font-medium text-amet-indigo/80">{label}</span>
      {isValidElement(children)
        ? cloneElement(children, {
            id,
            "aria-invalid": !!error,
            "aria-describedby": error ? errorId : undefined,
          })
        : children}
      {error && (
        <span id={errorId} role="alert" className="block text-sm text-amet-purple">
          {error}
        </span>
      )}
    </label>
  );
}

export function inputClass(error?: string) {
  return `w-full rounded-xl border bg-amet-white px-4 py-3 text-amet-indigo outline-none transition placeholder:text-amet-indigo/60 ${
    error ? "border-amet-purple" : "border-amet-indigo/15 focus:border-amet-blue"
  }`;
}

export function choiceButtonClass(selected: boolean, disabled = false) {
  if (disabled) {
    return "cursor-not-allowed border-amet-indigo/10 bg-amet-indigo/[0.03] opacity-50";
  }
  if (selected) {
    return "border-amet-purple bg-amet-purple/10 text-amet-purple";
  }
  return "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-blue";
}
