type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  title,
  subtitle,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`mb-12 max-w-3xl ${alignment}`}>
      <h2 className="text-3xl font-bold tracking-tight text-amet-indigo sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-amet-purple via-amet-blue to-amet-indigo" />
      {subtitle && (
        <p className="mt-5 text-base leading-7 text-amet-indigo/65 sm:text-lg">{subtitle}</p>
      )}
    </div>
  );
}
