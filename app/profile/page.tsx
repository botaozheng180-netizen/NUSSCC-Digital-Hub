import { Notice, PageIntro } from "@/components/page-intro";
export const metadata = { title: "My Profile" };
export default function ProfilePage() {
  return (
    <div className="page">
      <PageIntro
        eyebrow="MY PROFILE"
        title="A home for your NUSSCC journey"
        description="Profiles will eventually bring together verified attendance, Trek progress, and achievements across devices."
      />
      <Notice>
        Member accounts are intentionally not part of Phase 1. Membership
        verification, recovery, and server-side roles must be agreed before
        registration opens.
      </Notice>
      <div className="empty-state">
        <div className="avatar-placeholder">?</div>
        <h2>Profiles are coming later</h2>
        <p>
          No login details or personal member information are being collected in
          this release.
        </p>
      </div>
    </div>
  );
}
