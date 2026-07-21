import { BrandLogo } from "@/components/BrandLogo";
import { heroContent } from "@/lib/content";

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden border-b border-amet-white/10 py-24 sm:py-32"
    >
      {/* Gradient background layer */}
      <div className="pointer-events-none absolute inset-0 amet-grad-bg opacity-30" />
      {/* Radial highlights */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_30%,_rgba(196,91,160,0.28),_transparent_65%),radial-gradient(ellipse_50%_50%_at_85%_10%,_rgba(91,154,223,0.22),_transparent_50%)]" />
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="inline-block rounded-full border border-amet-purple/40 bg-amet-purple/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amet-purple">
            {heroContent.eyebrow}
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-amet-white sm:text-6xl lg:text-7xl">
            {heroContent.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-amet-white/70">
            {heroContent.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#estagios"
              className="amet-grad-btn inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-amet-white shadow-lg shadow-amet-indigo/40"
            >
              {heroContent.ctaPrimary}
            </a>
            <a
              href="#quem-somos"
              className="inline-flex items-center justify-center rounded-full border border-amet-white/25 bg-amet-white/5 px-7 py-3.5 text-sm font-semibold text-amet-white transition hover:bg-amet-white/12 hover:border-amet-white/40"
            >
              {heroContent.ctaSecondary}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 lg:items-end">
          <div className="amet-grad-card p-10 shadow-2xl shadow-amet-indigo/60">
            <BrandLogo
              showName={false}
              priority
              markClassName="h-40 w-40 sm:h-48 sm:w-48"
            />
          </div>
          <p className="amet-grad-text text-center text-xl font-semibold tracking-[0.1em] lg:text-right">
            AMET Saúde &amp; Estética
          </p>
        </div>
      </div>
    </section>
  );
}
