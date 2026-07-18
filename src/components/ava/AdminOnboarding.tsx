import { FlowTree } from "@/components/ava/FlowTree";
import { buildAdminFlow } from "@/lib/ava/flows";

type AdminOnboardingProps = {
  invitedOrExtraUsers: boolean;
  subjectsCount: number;
  classesCount: number;
  enrollmentsCount: number;
  publishedLessonsCount: number;
  firstClassId?: string | null;
};

export function AdminOnboarding(props: AdminOnboardingProps) {
  const tree = buildAdminFlow(props);
  if (tree.steps.every((step) => step.done)) {
    return null;
  }
  return <FlowTree tree={tree} />;
}
