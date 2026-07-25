import { Notice, PageIntro } from "@/components/page-intro";
export const metadata = { title: "Events" };
export default function EventsPage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="EVENTS"
        title="Find your next NUSSCC experience"
        description="The existing AY26/27 calendar will be migrated here carefully, preserving its planning, filtering, export, and backup tools."
      />
      <Notice>
        No shared event data is published yet. The original calendar remains
        unchanged while its data model is prepared for safe migration.
      </Notice>
      <div className="placeholder-grid">
        <article className="placeholder-card wide">
          <span className="skeleton label" />
          <span className="skeleton title" />
          <div className="calendar-preview">
            {Array.from({ length: 21 }, (_, i) => (
              <span key={i} className={i === 9 || i === 16 ? "event-day" : ""}>
                {i + 1}
              </span>
            ))}
          </div>
        </article>
        <article className="placeholder-card">
          <span className="status-tag">Coming in the calendar migration</span>
          <h2>One reliable event source</h2>
          <p>
            Published details for members, protected planning fields for EXCO,
            and stable event links for personal tasks.
          </p>
        </article>
      </div>
    </div>
  );
}
