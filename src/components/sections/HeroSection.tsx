import { BrandLogo } from "@/components/BrandLogo";
import { heroContent } from "@/lib/content";

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden border-b border-amet-blue/10 bg-amet-white py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(40,90,206,0.14),_transparent_50%),radial-gradient(circle_at_bottom_left,_rgba(179,85,201,0.12),_transparent_45%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amet-purple">
            {heroContent.eyebrow}
          </p>
          <h1 className="mt-4 bg-gradient-to-r from-amet-indigo via-amet-blue to-amet-purple bg-clip-text pb-1 text-4xl font-bold leading-tight text-transparent sm:text-5xl lg:text-6xl">
            {heroContent.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-amet-indigo/70">
            {heroContent.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#estagios"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amet-blue to-amet-purple px-6 py-3 text-sm font-semibold text-amet-white shadow-md transition hover:from-amet-indigo hover:to-amet-blue"
            >
              {heroContent.ctaPrimary}
            </a>
            <a
              href="#quem-somos"
              className="inline-flex items-center justify-center rounded-full border border-amet-purple px-6 py-3 text-sm font-semibold text-amet-purple transition hover:bg-amet-purple/10"
            >
              {heroContent.ctaSecondary}
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <BrandLogo
            markClassName="h-44 w-44 sm:h-60 sm:w-60"
            nameClassName="text-2xl font-semibold tracking-[0.08em] text-amet-blue sm:text-3xl"
          />
        </div>
      </div>
    </section>
  );
}
