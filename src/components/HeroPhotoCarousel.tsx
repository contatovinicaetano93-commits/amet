import Image from "next/image";

import { heroCarouselImages } from "@/lib/content";

const loop = [...heroCarouselImages, ...heroCarouselImages];

export function HeroPhotoCarousel() {
  return (
    <div className="hero-carousel pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="hero-carousel-track">
        {loop.map((image, index) => (
          <div key={`${image.src}-${index}`} className="hero-carousel-slide">
            <Image
              src={image.src}
              alt={index < heroCarouselImages.length ? image.alt : ""}
              fill
              sizes="420px"
              className="object-cover"
              priority={index < 2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
