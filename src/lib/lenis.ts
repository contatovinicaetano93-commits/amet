import Lenis from "lenis";

let instance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return instance;
}

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

/** Rola suavemente até um alvo (seletor ou elemento), usando Lenis se disponível. */
export function smoothScrollTo(target: string | HTMLElement, offset = -70) {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1.2 });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: "smooth" });
}
