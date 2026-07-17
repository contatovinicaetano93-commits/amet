import { DiferenciacaoSection } from "@/components/sections/DiferenciacaoSection";
import { EstagiosSection } from "@/components/sections/EstagiosSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ParceirosSection } from "@/components/sections/ParceirosSection";
import { PosGraduacaoSection } from "@/components/sections/PosGraduacaoSection";
import { PraticasCursosSection } from "@/components/sections/PraticasCursosSection";
import { QuemSomosSection } from "@/components/sections/QuemSomosSection";
import { UnidadesEquipamentosSection } from "@/components/sections/UnidadesEquipamentosSection";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <QuemSomosSection />
      <DiferenciacaoSection />
      <PraticasCursosSection />
      <EstagiosSection />
      <PosGraduacaoSection />
      <UnidadesEquipamentosSection />
      <ParceirosSection />
    </main>
  );
}
