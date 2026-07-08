import { AmetMark } from "@/components/AmetMark";
import { HeroPhotoCarousel } from "@/components/HeroPhotoCarousel";
import { heroContent, heroStats } from "@/lib/content";

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center overflow-hidden bg-amet-indigo py-28"
    >
      <HeroPhotoCarousel />

      <div className="pointer-events-none absolute inset-0 z-[1] bg-amet-indigo/75" />
      <div className="hero-grid-bg pointer-events-none absolute inset-0 z-[2]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_top_right,_rgba(179,85,201,0.35),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(40,90,206,0.3),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-amet-indigo via-amet-indigo/85 to-amet-indigo/40" />
      <AmetMark className="pointer-events-none absolute -right-24 top-1/2 z-[2] h-[34rem] w-[34rem] -translate-y-1/2 opacity-[0.07] sm:-right-16" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-amet-white/15 bg-amet-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amet-white/75 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amet-purple" />
          {heroContent.eyebrow}
        </p>

        <h1 className="mt-6 text-[clamp(2.5rem,6vw,5.25rem)] font-bold leading-[0.98] tracking-tight text-amet-white">
          {heroContent.title}
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-amet-white/65">
          {heroContent.subtitle}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="#estagios"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amet-purple to-amet-blue px-7 py-3.5 text-sm font-semibold text-amet-white shadow-lg transition hover:from-amet-blue hover:to-amet-purple"
          >
            {heroContent.ctaPrimary}
          </a>
          <a
            href="#quem-somos"
            className="inline-flex items-center justify-center rounded-full border border-amet-white/25 px-7 py-3.5 text-sm font-semibold text-amet-white/85 backdrop-blur-sm transition hover:bg-amet-white/10 hover:text-amet-white"
          >
            {heroContent.ctaSecondary}
          </a>
        </div>

        <dl className="mt-16 flex flex-wrap gap-x-10 gap-y-6 border-t border-amet-white/10 pt-8">
          {heroStats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <dt className="order-2 mt-1 max-w-[9rem] text-[11px] font-semibold uppercase tracking-wide text-amet-white/40">
                {stat.label}
              </dt>
              <dd className="order-1 text-3xl font-bold leading-none text-amet-white sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
