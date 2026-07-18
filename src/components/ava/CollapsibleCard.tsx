"use client";

import { useEffect, useId, useState } from "react";

type CollapsibleCardProps = {
  id?: string;
  kicker?: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function CollapsibleCard({
  id,
  kicker,
  title,
  description,
  defaultOpen = true,
  children,
  className = "",
}: CollapsibleCardProps) {
  const reactId = useId();
  const panelId = `ava-card-panel-${reactId}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const syncFromHash = () => {
      if (window.location.hash === `#${id}`) {
        setOpen(true);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [id]);

  return (
    <section
      id={id}
      className={`ava-panel ava-collapse-card scroll-mt-24 ${className}`.trim()}
    >
      <button
        type="button"
        className="ava-collapse-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="ava-collapse-copy">
          {kicker ? <span className="ava-kicker">{kicker}</span> : null}
          <span className="ava-collapse-title">{title}</span>
          {description ? (
            <span className="ava-collapse-desc">{description}</span>
          ) : null}
        </span>
        <span className="ava-collapse-action">
          {open ? "Fechar" : "Abrir"}
          <span className="ava-collapse-chevron" aria-hidden>
            {open ? "▾" : "▸"}
          </span>
        </span>
      </button>
      {open ? (
        <div id={panelId} className="ava-collapse-body">
          {children}
        </div>
      ) : null}
    </section>
  );
}
