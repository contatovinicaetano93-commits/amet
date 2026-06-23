import { BrandLogo } from "@/components/BrandLogo";
import { siteContent } from "@/lib/content";

export function SiteFooter() {
  const whatsappHref = `https://wa.me/${siteContent.whatsapp.replace(/\D/g, "")}`;

  return (
    <footer className="border-t border-amet-blue/10 bg-amet-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 border-b border-amet-blue/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <BrandLogo nameClassName="text-lg font-semibold tracking-[0.06em] text-amet-blue" />
          <div className="space-y-2 text-center text-sm text-amet-indigo/75 sm:text-right">
            <a
              href="https://instagram.com/ametsaude"
              target="_blank"
              rel="noopener noreferrer"
              className="block transition hover:text-amet-purple"
            >
              Instagram: {siteContent.instagram}
            </a>
            <a href="tel:+551123676594" className="block transition hover:text-amet-purple">
              Telefone: {siteContent.phone}
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition hover:text-amet-blue"
            >
              WhatsApp: {siteContent.whatsappDisplay}
            </a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-amet-indigo/45">{siteContent.cadan}</p>
      </div>
    </footer>
  );
}
