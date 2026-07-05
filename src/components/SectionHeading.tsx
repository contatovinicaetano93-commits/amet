type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
};

export function SectionHeading({
  title,
  subtitle,
  align = "center",
  light = false,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`mb-12 max-w-3xl ${alignment}`}>
      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? "text-amet-white" : "text-amet-indigo"
        }`}
      >
        {title}
      </h2>
      <div
        className={`mx-auto mt-4 h-1 w-16 rounded-full ${
          light
            ? "bg-amet-white/70"
            : "bg-gradient-to-r from-amet-purple via-amet-blue to-amet-indigo"
        }`}
      />
      {subtitle && (
        <p
          className={`mt-5 text-base leading-7 sm:text-lg ${
            light ? "text-amet-white/80" : "text-amet-indigo/65"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
