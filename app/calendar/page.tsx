import { ReadOnlyCalendar } from "@/components/events/read-only-calendar";
import { PageIntro } from "@/components/page-intro";

export const metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="MEMBER CALENDAR"
        title="Plan the NUSSCC year together"
        description="The AY26/27 internal calendar brings event planning, EXCO tasks, filters, agenda views, and backups into one workspace."
      />
      <ReadOnlyCalendar />
    </div>
  );
}
