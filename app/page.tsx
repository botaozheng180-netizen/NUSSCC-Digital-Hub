import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";
import { Icon } from "@/components/icons";

const journeys = [
  {
    href: "/events",
    icon: "calendar",
    tone: "blue",
    title: "Discover events",
    text: "Find the next company visit, technical workshop, or sharing session.",
    action: "Explore events",
  },
  {
    href: "/tasks",
    icon: "tasks",
    tone: "mint",
    title: "Stay organised",
    text: "Keep your personal preparation and follow-up tasks private on this device.",
    action: "Open my tasks",
  },
  {
    href: "/trek",
    icon: "trek",
    tone: "violet",
    title: "Explore the ecosystem",
    text: "See how NUSSCC activities connect across the semiconductor value chain.",
    action: "View the Trek",
  },
];

export default function Dashboard() {
  return (
    <div className="page dashboard">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">NUSSCC DIGITAL HUB</span>
          <h1>
            Your semiconductor
            <br />
            <em>journey starts here.</em>
          </h1>
          <p>
            Discover club events, organise what matters, and build a meaningful
            picture of the semiconductor ecosystem—one experience at a time.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/events">
              Explore upcoming events <Icon name="arrow" size={18} />
            </Link>
            <Link className="button secondary" href="/trek">
              See how the Trek works
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="chip">
            <ClubLogo title="NUSSCC interconnect mark" showFrame={false} />
          </div>
          <div className="node n1" />
          <div className="node n2" />
          <div className="node n3" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ONE CONNECTED EXPERIENCE</span>
            <h2>Everything you need to take part</h2>
          </div>
          <p>
            The foundation is ready. Features will arrive incrementally without
            losing what already works.
          </p>
        </div>
        <div className="journey-grid">
          {journeys.map((card) => (
            <Link href={card.href} key={card.href} className="journey-card">
              <div className={`icon-tile ${card.tone}`}>
                <Icon name={card.icon} size={25} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <span>
                {card.action} <Icon name="arrow" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="progress-banner">
        <div>
          <span className="eyebrow light">THE VIRTUAL SEMICONDUCTOR TREK</span>
          <h2>More than a list of events.</h2>
          <p>
            As the programme grows, verified participation will reveal the parts
            of the value chain you have explored and where you can go next.
          </p>
          <Link href="/trek">
            Preview the roadmap <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="mini-roadmap" aria-hidden="true">
          <span className="step done">1</span>
          <i />
          <span className="step active">2</span>
          <i />
          <span className="step">3</span>
          <i />
          <span className="step">4</span>
          <small>Explore · Connect · Progress</small>
        </div>
      </section>

      <section className="privacy-row">
        <Icon name="shield" size={30} />
        <div>
          <h3>Private by design, shared where it matters</h3>
          <p>
            Your personal tasks stay in this browser during the first release.
            Shared accounts and verified progress will only be introduced with
            proper server-side protection.
          </p>
        </div>
        <Link href="/settings">
          Data & privacy <Icon name="arrow" size={16} />
        </Link>
      </section>
    </div>
  );
}
