"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

import { HeroScene } from "@/components/HeroScene";
import { StatCounter } from "@/components/StatCounter";
import { heroContent, heroStats } from "@/lib/content";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <HeroScene>
      <motion.div
        variants={container}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
      >
        <motion.p
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-amet-white/15 bg-amet-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amet-white/75 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amet-purple" />
          {heroContent.eyebrow}
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-6 text-[clamp(2.5rem,6vw,5.25rem)] font-bold leading-[0.98] tracking-tight text-amet-white"
        >
          {heroContent.title}
        </motion.h1>

        <motion.p variants={item} className="mt-6 max-w-2xl text-lg leading-8 text-amet-white/65">
          {heroContent.subtitle}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-col gap-3 sm:flex-row">
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
        </motion.div>

        <motion.dl
          variants={item}
          className="mt-16 flex flex-wrap gap-x-10 gap-y-6 border-t border-amet-white/10 pt-8"
        >
          {heroStats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <dt className="order-2 mt-1 max-w-[9rem] text-[11px] font-semibold uppercase tracking-wide text-amet-white/40">
                {stat.label}
              </dt>
              <dd className="order-1 text-3xl font-bold leading-none text-amet-white sm:text-4xl">
                <StatCounter value={stat.value} />
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </HeroScene>
  );
}
