"use client";

import { useMemo, useState } from "react";
import { EVENT_TEAMS, type CalendarEvent, type EventTeam } from "@/lib/events/model";
import { type EventPlanningTask, taskEvent } from "@/lib/events/planning-tasks";

type Props = {
  events: CalendarEvent[];
  tasks: EventPlanningTask[];
  onChange: (tasks: EventPlanningTask[]) => void;
};

export function PlanningTaskBoard({ events, tasks, onChange }: Props) {
  const [text, setText] = useState("");
  const [eventId, setEventId] = useState("");
  const [due, setDue] = useState("");
  const [owner, setOwner] = useState("");
  const [team, setTeam] = useState<EventTeam | "">("");
  const [showCompleted, setShowCompleted] = useState(true);
  const visible = useMemo(() => tasks.filter((task) => showCompleted || !task.done), [showCompleted, tasks]);

  const addTask = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!text.trim()) return;
    const selected = events.find((event) => String(event.legacyId) === eventId);
    onChange([...tasks, {
      id: `local-task-${crypto.randomUUID()}`,
      text: text.trim(), done: false, teams: team ? [team] : [],
      eventLegacyId: selected?.legacyId ?? null, due: due || null,
      owner: owner.trim() || null, description: "", links: [], images: [],
    }]);
    setText(""); setDue(""); setOwner("");
  };

  return (
    <details className="calendar-panel planning-panel" open>
      <summary>✅ <strong>EXCO Planning Tasks</strong> <small>{tasks.filter((task) => !task.done).length} open</small></summary>
      <form className="planning-task-form" onSubmit={addTask}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Add a planning task…" aria-label="Task" required />
        <select value={eventId} onChange={(event) => setEventId(event.target.value)} aria-label="Linked event"><option value="">No linked event</option>{events.map((event) => <option value={String(event.legacyId)} key={event.id}>{event.public.name}</option>)}</select>
        <input type="date" value={due} onChange={(event) => setDue(event.target.value)} aria-label="Due date" />
        <input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Owner" aria-label="Owner" />
        <select value={team} onChange={(event) => setTeam(event.target.value as EventTeam | "")} aria-label="Managing team"><option value="">No team</option>{EVENT_TEAMS.map((value) => <option value={value} key={value}>{value}</option>)}</select>
        <button type="submit">＋ Add task</button>
      </form>
      <div className="planning-task-controls"><label><input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} /> Show completed</label></div>
      <div className="planning-task-list">
        {visible.length === 0 && <p className="planning-empty">No planning tasks in this view.</p>}
        {visible.map((task) => {
          const linked = taskEvent(task, events);
          return <article className={task.done ? "done" : ""} key={task.id}>
            <input type="checkbox" checked={task.done} onChange={() => onChange(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} aria-label={`Complete ${task.text}`} />
            <div><strong>{task.text}</strong><span>{[linked?.public.name, task.due && `Due ${task.due}`, task.owner && `Owner: ${task.owner}`, ...task.teams].filter(Boolean).join(" · ") || "General planning"}</span></div>
            <button type="button" onClick={() => onChange(tasks.filter((item) => item.id !== task.id))} aria-label={`Delete ${task.text}`}>×</button>
          </article>;
        })}
      </div>
    </details>
  );
}
