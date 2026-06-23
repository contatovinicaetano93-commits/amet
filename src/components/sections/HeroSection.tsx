import { BrandLogo } from "@/components/BrandLogo";
import { heroContent } from "@/lib/content";

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden border-b border-amet-white/10 py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(40,90,206,0.35),_transparent_42%),radial-gradient(circle_at_85%_15%,_rgba(179,85,201,0.25),_transparent_28%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amet-purple">
            {heroContent.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-amet-white sm:text-5xl lg:text-6xl">
            {heroContent.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-amet-white/75">
            {heroContent.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#estagios"
              className="inline-flex items-center justify-center rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-amet-white transition hover:bg-amet-purple"
            >
              {heroContent.ctaPrimary}
            </a>
            <a
              href="#quem-somos"
              className="inline-flex items-center justify-center rounded-full border border-amet-purple px-6 py-3 text-sm font-semibold text-amet-white transition hover:bg-amet-purple/20"
            >
              {heroContent.ctaSecondary}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-8 lg:items-end">
          <div className="rounded-[2rem] border border-amet-white/15 bg-amet-white/5 p-10 shadow-2xl shadow-amet-blue/20">
            <BrandLogo
              showName={false}
              priority
              markClassName="h-40 w-40 sm:h-48 sm:w-48"
            />
          </div>
          <p className="text-center text-2xl font-semibold tracking-[0.12em] text-amet-blue lg:text-right">
            AMET Saúde & Estética
          </p>
        </div>
      </div>
    </section>
  );
}
