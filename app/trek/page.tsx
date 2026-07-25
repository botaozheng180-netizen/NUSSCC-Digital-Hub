import { PageIntro } from "@/components/page-intro";
export const metadata = { title: "Semiconductor Trek" };
const stages = [
  "Research & materials",
  "Equipment",
  "Chip design & EDA",
  "Wafer fabrication",
  "Memory & logic",
  "Advanced packaging",
  "Testing & reliability",
  "Applications & systems",
];
export default function TrekPage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="VIRTUAL SEMICONDUCTOR TREK"
        title="See the industry as one connected journey"
        description="Each NUSSCC experience can illuminate a different part of the semiconductor ecosystem. Personal progress will follow after secure accounts and attendance verification."
      />
      <div className="stage-grid">
        {stages.map((stage, i) => (
          <article key={stage}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{stage}</h3>
            <p>{i < 3 ? "Roadmap preview" : "Future roadmap stage"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
