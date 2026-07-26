import Link from "next/link";
import { Notice, PageIntro } from "@/components/page-intro";
export const metadata = { title: "Events" };
export default function EventsPage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="EVENTS"
        title="Find your next NUSSCC experience"
        description="Discover public highlights from NUSSCC and watch this space for upcoming activities open to the wider community."
      />
      <Notice>
        This public events space is being prepared. The internal planning calendar
        now has its own member-facing route.
      </Notice>
      <div className="placeholder-grid">
        <article className="placeholder-card wide">
          <span className="status-tag">COMING SOON</span>
          <h2>Upcoming public events</h2>
          <p>Confirmed opportunities, talks, visits, and club activities intended for public discovery will appear here.</p>
        </article>
        <article className="placeholder-card">
          <span className="status-tag">MEMBER CALENDAR</span>
          <h2>Looking for internal planning?</h2>
          <p>NUSSCC members can use the dedicated calendar route during the migration preview.</p>
          <Link className="button primary" href="/calendar">Open calendar</Link>
        </article>
      </div>
    </div>
  );
}
