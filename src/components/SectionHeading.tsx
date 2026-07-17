"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

type SectionHeadingProps = {
  index: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: "purple" | "blue" | "indigo";
  light?: boolean;
};

const accentText = {
  purple: "text-amet-purple",
  blue: "text-amet-blue",
  indigo: "text-amet-indigo",
} as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function SectionHeading({
  index,
  eyebrow,
  title,
  subtitle,
  accent = "indigo",
  light = false,
}: SectionHeadingProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="mb-12 max-w-3xl"
      variants={container}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
    >
      <motion.div variants={item} className="flex items-baseline gap-3">
        <span
          className={`font-mono text-sm font-semibold tracking-wider ${
            light ? "text-amet-white/70" : accentText[accent]
          }`}
        >
          {index}
        </span>
        <span className={`h-px w-8 ${light ? "bg-amet-white/20" : "bg-amet-indigo/15"}`} />
        <span
          className={`text-xs font-semibold uppercase tracking-[0.2em] ${
            light ? "text-amet-white/45" : "text-amet-indigo/45"
          }`}
        >
          {eyebrow}
        </span>
      </motion.div>
      <motion.div variants={item}>
        <h2
          className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${
            light ? "text-amet-white" : "text-amet-indigo"
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`mt-4 text-base leading-7 sm:text-lg ${
              light ? "text-amet-white/70" : "text-amet-indigo/65"
            }`}
          >
            {subtitle}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
