"use client";
import { useEffect, useState } from "react";
import { Notice, PageIntro } from "@/components/page-intro";
const KEY = "nusscc_my_tasks_private_v1";
export default function TasksPage() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    try {
      const value = localStorage.getItem(KEY);
      const parsed = value ? JSON.parse(value) : [];
      setCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setCount(0);
    }
  }, []);
  return (
    <div className="page">
      <PageIntro
        eyebrow="MY TASKS"
        title="Your private workspace"
        description="Personal preparation and follow-up stay on this device. The full task board will be migrated without renaming or overwriting its existing storage."
      />
      <Notice>
        This foundation only reads the number of legacy tasks. It does not
        alter, upload, or expose their contents.
      </Notice>
      <div className="metric-card">
        <span>Legacy tasks found on this device</span>
        <strong>{count === null ? "—" : count}</strong>
        <small>
          {count
            ? "Your data is ready for the later task-board migration."
            : "No stored tasks were found for this site origin."}
        </small>
      </div>
    </div>
  );
}
