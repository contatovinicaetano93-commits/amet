import { AmetMark } from "@/components/AmetMark";
import { siteContent } from "@/lib/content";

type BrandLogoProps = {
  showName?: boolean;
  markClassName?: string;
  nameClassName?: string;
};

export function BrandLogo({
  showName = true,
  markClassName = "h-11 w-11",
  nameClassName = "text-base font-semibold tracking-[0.06em] text-amet-blue sm:text-lg",
}: BrandLogoProps) {
  return (
    <span className="inline-flex flex-col items-center gap-1.5">
      <AmetMark className={markClassName} />
      {showName && (
        <span className={`whitespace-nowrap text-center ${nameClassName}`}>
          {siteContent.brand}
        </span>
      )}
    </span>
  );
}
