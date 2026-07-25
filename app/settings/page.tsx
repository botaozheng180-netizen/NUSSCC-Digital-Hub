"use client";
import { useState } from "react";
import { PageIntro } from "@/components/page-intro";
export default function SettingsPage() {
  const [compact, setCompact] = useState(false);
  return (
    <div className="page">
      <PageIntro
        eyebrow="SETTINGS"
        title="Your experience, your control"
        description="Only device-local interface preferences belong here until secure member accounts are available."
      />
      <div className="settings-card">
        <div>
          <h3>Compact display</h3>
          <p>Preview a denser layout preference on this device.</p>
        </div>
        <button
          className={`toggle ${compact ? "on" : ""}`}
          onClick={() => setCompact(!compact)}
          aria-pressed={compact}
        >
          <span />
        </button>
      </div>
      <div className="settings-card disabled">
        <div>
          <h3>Cloud task sync</h3>
          <p>
            Optional account sync will only arrive after privacy and ownership
            checks are tested.
          </p>
        </div>
        <span className="status-tag">Not available</span>
      </div>
    </div>
  );
}
