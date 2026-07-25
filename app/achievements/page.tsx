import { PageIntro } from "@/components/page-intro";
export const metadata = { title: "Achievements" };
const items = [
  ["Curious Explorer", "Take your first steps into the semiconductor world."],
  [
    "Value Chain Navigator",
    "Explore events across multiple parts of the value chain.",
  ],
  [
    "Community Builder",
    "Help create meaningful experiences for other members.",
  ],
];
export default function AchievementsPage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="ACHIEVEMENTS"
        title="Recognition for meaningful exploration"
        description="Titles will use transparent, configurable participation or contribution criteria—not points for simply opening a page."
      />
      <div className="achievement-list">
        {items.map(([title, text], i) => (
          <article key={title}>
            <span className={`badge b${i + 1}`}>◇</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <small>Preview</small>
          </article>
        ))}
      </div>
    </div>
  );
}
