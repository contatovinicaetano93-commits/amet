import Image from "next/image";

import { siteContent } from "@/lib/content";

type BrandLogoProps = {
  showName?: boolean;
  markClassName?: string;
  nameClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  showName = true,
  markClassName = "h-12 w-12",
  nameClassName = "text-base font-semibold tracking-wide text-amet-blue sm:text-lg",
  priority = false,
}: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/amet-mark.svg"
        alt=""
        aria-hidden
        width={64}
        height={64}
        priority={priority}
        className={markClassName}
      />
      {showName && <span className={nameClassName}>{siteContent.brand}</span>}
    </span>
  );
}
