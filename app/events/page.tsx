import { ReadOnlyCalendar } from "@/components/events/read-only-calendar";
import { PageIntro } from "@/components/page-intro";
export const metadata = { title: "Events" };
export default function EventsPage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="EVENTS"
        title="Find your next NUSSCC experience"
        description="The existing AY26/27 calendar will be migrated here carefully, preserving its planning, filtering, export, and backup tools."
      />
      <ReadOnlyCalendar />
    </div>
  );
}
