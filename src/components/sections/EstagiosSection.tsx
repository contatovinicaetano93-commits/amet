import { ApplicationForm } from "@/components/ApplicationForm";
import { SectionHeading } from "@/components/SectionHeading";
import { estagiosContent } from "@/lib/content";

export function EstagiosSection() {
  return (
    <section id="estagios" className="border-b border-amet-blue/10 bg-amet-blue/[0.03] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading title={estagiosContent.title} />
        <ApplicationForm />
      </div>
    </section>
  );
}
