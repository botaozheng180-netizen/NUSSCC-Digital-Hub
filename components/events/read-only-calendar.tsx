"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EventEditor } from "@/components/events/event-editor";
import { PlanningTaskBoard } from "@/components/events/planning-task-board";
import { AY2627_WEEKS, academicDateToISO } from "@/lib/events/academic-calendar";
import { AY2627_PREVIEW_EVENTS } from "@/lib/events/ay2627-preview-data";
import { readLegacyLocalEvents, type LocalEventReadResult } from "@/lib/events/local-storage";
import {
  LEGACY_TODOS_STORAGE_KEY,
  buildCalendarICS,
  previewCalendarImport,
  type ImportPreview,
} from "@/lib/events/import-export";
import { LocalStorageEventRepository, type EventRepository } from "@/lib/events/event-repository";
import { readPlanningTasks, writePlanningTasks, type EventPlanningTask } from "@/lib/events/planning-tasks";
import {
  EVENT_STATUSES,
  EVENT_TEAMS,
  EVENT_TYPES,
  WEEKDAYS,
  type CalendarEvent,
  type CalendarEventInput,
} from "@/lib/events/model";

const EMPTY: LocalEventReadResult = { events: [], rejected: 0, issues: [], source: "empty" };

const TEAM_META = {
  presidential: ["⭐", "Presidential Cell"],
  finance: ["💰", "Finance"],
  hr: ["📁", "Human Resources & Welfare"],
  publicity: ["🎨", "Publicity"],
  internal: ["🏛️", "Internal Events"],
  external: ["🚀", "External Events"],
  allmembers: ["👥", "All Members"],
} as const;
const TYPE_META = {
  industry: ["🎤", "Company Talk"],
  visit: ["🏭", "Company Visit"],
  extpartner: ["🌐", "External Partners"],
  bonding: ["🤝", "Club Bonding"],
  external: ["📌", "Others"],
} as const;
const STATUS_META = {
  potential: ["🔍", "Potential / Sourcing"],
  contacted: ["📨", "Outreach Sent"],
  discussion: ["💬", "In Discussion"],
  confirmed: ["✅", "Confirmed"],
  completed: ["🏁", "Completed"],
  declined: ["🚫", "Declined / Cancelled"],
} as const;

function eventDate(event: CalendarEvent) {
  return academicDateToISO(event.public.start.weekId, event.public.start.day) ?? "";
}

function addDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

function timeLabel(event: CalendarEvent) {
  if (event.public.allDay) return "All day";
  if (!event.public.startTime) return "Time to be confirmed";
  return event.public.endTime
    ? `${event.public.startTime}–${event.public.endTime}`
    : event.public.startTime;
}

function googleCalendarUrl(event: CalendarEvent) {
  const startDate = eventDate(event).replaceAll("-", "");
  const endDate = event.public.end
    ? (academicDateToISO(event.public.end.weekId, event.public.end.day) ?? eventDate(event)).replaceAll("-", "")
    : startDate;
  const timed = (date: string, time: string | null) => `${date}T${(time ?? "00:00").replace(":", "")}00`;
  const dates = event.public.allDay
    ? `${startDate}/${addDay(`${endDate.slice(0, 4)}-${endDate.slice(4, 6)}-${endDate.slice(6, 8)}`).replaceAll("-", "")}`
    : `${timed(startDate, event.public.startTime)}/${timed(endDate, event.public.endTime ?? event.public.startTime)}`;
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: event.public.name,
    dates,
    ctz: "Asia/Singapore",
    details: event.public.description,
    location: event.public.venue,
  });
  return `https://calendar.google.com/calendar/render?${query}`;
}

export function ReadOnlyCalendar() {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [result, setResult] = useState<LocalEventReadResult>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [query, setQuery] = useState("");
  const [teamFilters, setTeamFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [tasks, setTasks] = useState<EventPlanningTask[]>([]);
  const [view, setView] = useState<"calendar" | "agenda">("calendar");
  const [dataNotice, setDataNotice] = useState("");
  const importInput = useRef<HTMLInputElement>(null);
  const repository = useRef<EventRepository | null>(null);

  useEffect(() => {
    try {
      repository.current = new LocalStorageEventRepository(window.localStorage, { fallbackEvents: AY2627_PREVIEW_EVENTS });
      setResult(readLegacyLocalEvents(window.localStorage));
      setTasks(readPlanningTasks(window.localStorage));
    } catch {
      setResult({
        ...EMPTY,
        rejected: 1,
        issues: [{ field: "storage", message: "Browser storage is unavailable." }],
      });
    } finally {
      setLoaded(true);
    }
  }, []);

  const weeks = useMemo(
    () => AY2627_WEEKS.filter((week) => week.semester === semester),
    [semester],
  );
  const sourceEvents = result.source === "legacy-local-storage" ? result.events : AY2627_PREVIEW_EVENTS;
  const semesterEvents = useMemo(
    () => sourceEvents.filter((event) => event.public.start.weekId.startsWith(`s${semester}`)),
    [semester, sourceEvents],
  );
  const teamCounts = useMemo(
    () => Object.fromEntries(EVENT_TEAMS.map((team) => [team, semesterEvents.filter((event) => event.planning.teams.includes(team)).length])),
    [semesterEvents],
  );
  const toggleFilter = (value: string, values: string[], update: (values: string[]) => void) =>
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return semesterEvents.filter((event) => {
      if (teamFilters.length && !event.planning.teams.some((team) => teamFilters.includes(team))) return false;
      if (typeFilters.length && !typeFilters.includes(event.public.type)) return false;
      if (statusFilters.length && !statusFilters.includes(event.planning.status)) return false;
      if (!normalizedQuery) return true;
      return [event.public.name, event.public.venue, event.public.description, ...event.planning.teams]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, semesterEvents, statusFilters, teamFilters, typeFilters]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    visibleEvents.forEach((event) => {
      let date = eventDate(event);
      const end = event.public.end
        ? academicDateToISO(event.public.end.weekId, event.public.end.day)
        : date;
      if (!date || !end) return;
      while (date <= end) {
        map.set(date, [...(map.get(date) ?? []), event]);
        date = addDay(date);
      }
    });
    return map;
  }, [visibleEvents]);

  const exportCalendar = () => {
    let todos: unknown[] = [];
    try {
      const saved = window.localStorage.getItem(LEGACY_TODOS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed)) todos = parsed;
    } catch {}
    const backup = repository.current?.createBackup(todos);
    if (!backup) return;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `NUSSemiCon_Events_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    repository.current?.markBackupCreated();
    setDataNotice("Backup exported successfully.");
  };

  const exportICS = () => {
    const blob = new Blob([buildCalendarICS(sourceEvents)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "NUSSemiCon_Calendar_AY2627.ics";
    anchor.click();
    URL.revokeObjectURL(url);
    setDataNotice("Calendar file exported successfully.");
  };

  const chooseImport = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    try {
      setImportPreview(previewCalendarImport(JSON.parse(await file.text())));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "The selected backup could not be read.");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  const proceedWithImport = () => {
    if (!importPreview || !repository.current) return;
    try {
      const replaced = repository.current.replaceAll(importPreview);
      setResult({ events: replaced.events, rejected: 0, issues: [], source: "legacy-local-storage" });
      setTasks(readPlanningTasks(window.localStorage));
      setImportPreview(null);
      setDataNotice(`Imported ${replaced.events.length} event(s) successfully.`);
    } catch (error) {
      setImportError(`${error instanceof Error ? error.message : "Import failed."} The previous calendar was restored.`);
      setImportPreview(null);
    }
  };

  const importChanges = useMemo(() => {
    if (!importPreview) return null;
    const currentIds = new Set(sourceEvents.map((event) => String(event.legacyId ?? event.id)));
    const incomingIds = new Set(importPreview.events.map((event) => String(event.legacyId ?? event.id)));
    return {
      added: [...incomingIds].filter((id) => !currentIds.has(id)).length,
      retained: [...incomingIds].filter((id) => currentIds.has(id)).length,
      removed: [...currentIds].filter((id) => !incomingIds.has(id)).length,
    };
  }, [importPreview, sourceEvents]);

  const saveEvent = (input: CalendarEventInput) => {
    if (!repository.current) return;
    if (editingEvent) repository.current.update(editingEvent.id, input);
    else repository.current.create(input);
    const events = repository.current.list();
    setResult({ events, rejected: 0, issues: [], source: "legacy-local-storage" });
    setEditorOpen(false);
    setEditingEvent(null);
    setSelected(null);
  };

  const deleteSelectedEvent = () => {
    if (!selected || !window.confirm(`Delete “${selected.public.name}”? This change is saved in this browser.`)) return;
    repository.current?.delete(selected.id);
    const events = repository.current?.list() ?? [];
    setResult({ events, rejected: 0, issues: [], source: "legacy-local-storage" });
    setSelected(null);
  };

  const changeTasks = (next: EventPlanningTask[]) => {
    writePlanningTasks(window.localStorage, next);
    setTasks(next);
  };

  const agendaEvents = useMemo(
    () => [...visibleEvents].sort((left, right) => eventDate(left).localeCompare(eventDate(right)) || (left.public.startTime ?? "").localeCompare(right.public.startTime ?? "")),
    [visibleEvents],
  );

  return (
    <section className="calendar-migration" aria-labelledby="calendar-heading">
      <div className="calendar-toolbar">
        <div>
          <span className="status-tag">Public layout preview · Local editing</span>
          <h2 id="calendar-heading">AY2026/27 academic calendar</h2>
          <p>Current snapshot: 26 July 2026, 11:50 SGT</p>
        </div>
        <div className="semester-switch" aria-label="Semester">
          {([1, 2] as const).map((value) => (
            <button
              type="button"
              key={value}
              className={semester === value ? "active" : ""}
              onClick={() => setSemester(value)}
            >
              Semester {value}
            </button>
          ))}
        </div>
        <button className="add-event-button" type="button" onClick={() => { setEditingEvent(null); setEditorOpen(true); }}>＋ Add event</button>
      </div>

      <details className="calendar-panel overview-panel" open>
        <summary>📊 <strong>Overview</strong></summary>
        <div className="overview-grid">
          <article className="overview-card overview-total"><span>🗓️</span><strong>{semesterEvents.length}</strong><small>Semester {semester} events</small></article>
          <article className="overview-card overview-potential"><span>🔍</span><strong>{semesterEvents.filter((event) => event.planning.status === "potential").length}</strong><small>Potential / sourcing</small></article>
          {EVENT_TEAMS.map((team) => (
            <article className={`overview-card team-${team}`} key={team}>
              <span>{TEAM_META[team][0]}</span><strong>{teamCounts[team]}</strong><small>{TEAM_META[team][1]}</small>
            </article>
          ))}
        </div>
      </details>

      <details className="calendar-panel filters-panel" open>
        <summary>🔎 <strong>Filters</strong></summary>
        <div className="filter-groups">
          <div className="filter-group">
            <strong>Team Managing:</strong>
            <div>{EVENT_TEAMS.map((team) => <button type="button" aria-pressed={teamFilters.includes(team)} className={`filter-chip team-${team} ${teamFilters.includes(team) ? "active" : ""}`} onClick={() => toggleFilter(team, teamFilters, setTeamFilters)} key={team}>{TEAM_META[team][0]} {TEAM_META[team][1]}</button>)}</div>
          </div>
          <div className="filter-group">
            <strong>Event Types:</strong>
            <div>{EVENT_TYPES.map((type) => <button type="button" aria-pressed={typeFilters.includes(type)} className={`filter-chip type-${type} ${typeFilters.includes(type) ? "active" : ""}`} onClick={() => toggleFilter(type, typeFilters, setTypeFilters)} key={type}>{TYPE_META[type][0]} {TYPE_META[type][1]}</button>)}</div>
          </div>
          <div className="filter-group">
            <strong>Status:</strong>
            <div>{EVENT_STATUSES.map((status) => <button type="button" aria-pressed={statusFilters.includes(status)} className={`filter-chip status-${status} ${statusFilters.includes(status) ? "active" : ""}`} onClick={() => toggleFilter(status, statusFilters, setStatusFilters)} key={status}>{STATUS_META[status][0]} {STATUS_META[status][1]}</button>)}</div>
          </div>
        </div>
      </details>

      <div className="calendar-filters">
        <label>
          <span>Search events</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, venue, or team"
          />
        </label>
        <span>{visibleEvents.length} of {semesterEvents.length} event(s)</span>
        <div className="view-switch" aria-label="Calendar view">
          <button type="button" aria-pressed={view === "calendar"} className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>▦ Calendar</button>
          <button type="button" aria-pressed={view === "agenda"} className={view === "agenda" ? "active" : ""} onClick={() => setView("agenda")}>☷ Agenda</button>
        </div>
      </div>

      <div className="calendar-data-tools">
        <div><strong>Calendar data</strong><span>Legacy-compatible JSON backup and restore</span></div>
        <button type="button" onClick={exportCalendar}>💾 Export backup</button>
        <button type="button" onClick={exportICS}>📅 Export .ics</button>
        <button type="button" onClick={() => importInput.current?.click()}>📂 Import backup</button>
        <input ref={importInput} type="file" accept=".json,application/json" hidden onChange={(event) => chooseImport(event.target.files?.[0])} />
      </div>
      {importError && <div className="calendar-import-error" role="alert">⚠️ {importError}</div>}
      {dataNotice && <div className="calendar-data-notice" role="status">✅ {dataNotice}</div>}

      {loaded && result.issues.length > 0 && (
        <div className="calendar-warning" role="status">
          Loaded {result.events.length} event(s); {result.rejected} record(s) could not be read. Your original saved data was not changed.
        </div>
      )}

      {view === "calendar" ? <div className="calendar-scroll">
        <div className="academic-calendar" role="table" aria-label={`Semester ${semester} events`}>
          <div className="calendar-row calendar-header" role="row">
            <span role="columnheader">Academic week</span>
            {WEEKDAYS.map((day) => <span role="columnheader" key={day}>{day}</span>)}
          </div>
          {weeks.map((week) => (
            <div className={`calendar-row week-${week.kind}`} role="row" key={week.id}>
              <div className="week-label" role="rowheader">
                <strong>{week.label}</strong>
                <span>{week.monday}</span>
              </div>
              {WEEKDAYS.map((day, index) => {
                const date = academicDateToISO(week.id, day);
                const events = date ? eventsByDate.get(date) ?? [] : [];
                return (
                  <div className="calendar-day" role="cell" key={day} aria-label={date ?? day}>
                    {index < week.span && <time dateTime={date ?? undefined}>{date?.slice(8)}</time>}
                    {events.map((event) => (
                      <button
                        type="button"
                        className={`calendar-event type-${event.public.type} status-${event.planning.status}`}
                        key={event.id}
                        onClick={() => setSelected(event)}
                      >
                        <strong>{event.public.name}</strong>
                        <span>{timeLabel(event)}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div> : <div className="agenda-view">
        {agendaEvents.length === 0 && <p className="planning-empty">No events match the current filters.</p>}
        {agendaEvents.map((event) => <button type="button" className={`agenda-event type-${event.public.type}`} onClick={() => setSelected(event)} key={event.id}>
          <time dateTime={eventDate(event)}><strong>{eventDate(event).slice(8)}</strong><span>{eventDate(event).slice(0, 7)}</span></time>
          <div><div className="agenda-tags"><span>{TYPE_META[event.public.type][0]} {TYPE_META[event.public.type][1]}</span><span>{STATUS_META[event.planning.status][0]} {STATUS_META[event.planning.status][1]}</span></div><h3>{event.public.name}</h3><p>{timeLabel(event)}{event.public.venue ? ` · ${event.public.venue}` : ""}</p></div>
        </button>)}
      </div>}

      <PlanningTaskBoard events={sourceEvents} tasks={tasks} onChange={changeTasks} />

      {selected && (
        <div className="event-dialog-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section
            className="event-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="event-dialog-close" type="button" onClick={() => setSelected(null)} aria-label="Close event details">×</button>
            <div className="event-dialog-tags" aria-label="Event classification">
              <span className={`event-tag type-${selected.public.type}`}>{TYPE_META[selected.public.type][0]} {TYPE_META[selected.public.type][1]}</span>
              {selected.planning.teams.map((team) => <span className={`event-tag team-${team}`} key={team}>{TEAM_META[team][0]} {TEAM_META[team][1]}</span>)}
              <span className={`event-tag status-${selected.planning.status}`}>{STATUS_META[selected.planning.status][0]} {STATUS_META[selected.planning.status][1]}</span>
            </div>
            <h3 id="event-dialog-title">{selected.public.name}</h3>
            <div className="event-editor-preview">
              <button type="button" onClick={() => { setEditingEvent(selected); setEditorOpen(true); setSelected(null); }}>✏️ Edit Event</button>
              <span>Local preview mode</span>
            </div>
            <dl>
              <div><dt>Date</dt><dd>{eventDate(selected)}</dd></div>
              <div><dt>Time</dt><dd>{timeLabel(selected)}</dd></div>
              {selected.public.venue && <div><dt>Venue</dt><dd>{selected.public.venue}</dd></div>}
              <div><dt>Managing team</dt><dd>{selected.planning.teams.join(", ")}</dd></div>
            </dl>
            {selected.public.description && <p>{selected.public.description}</p>}
            {selected.public.links.length > 0 && (
              <div className="event-dialog-links">
                {selected.public.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.url}>{link.label || "Event resource"}</a>)}
              </div>
            )}
            <section className="event-tasks-preview">
              <div><strong>✅ Tasks for this event</strong><span>{tasks.filter((task) => task.eventLegacyId === selected.legacyId && !task.done).length} open</span></div>
              {tasks.filter((task) => task.eventLegacyId === selected.legacyId).length === 0 ? <p>No planning tasks for this event.</p> : tasks.filter((task) => task.eventLegacyId === selected.legacyId).map((task) => <label className={task.done ? "done" : ""} key={task.id}><input type="checkbox" checked={task.done} onChange={() => changeTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} /> {task.text}</label>)}
            </section>
            <div className="event-dialog-actions">
              <a href={googleCalendarUrl(selected)} target="_blank" rel="noreferrer">📅 Add to Google Calendar</a>
              <button type="button" className="delete" onClick={deleteSelectedEvent}>🗑️ Delete</button>
              <button type="button" onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        </div>
      )}

      {importPreview && (
        <div className="event-dialog-backdrop" role="presentation">
          <section className="event-dialog import-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="import-title">
            <span className="import-warning-icon">⚠️</span>
            <h3 id="import-title">Overwrite the current calendar?</h3>
            <p>
              Importing this backup will replace every event currently stored in this browser
              {importPreview.todos ? " and replace the EXCO planning tasks" : ""}. This cannot be undone unless you export a backup first.
            </p>
            <dl>
              <div><dt>Ready to import</dt><dd>{importPreview.events.length} event(s)</dd></div>
              <div><dt>Rejected</dt><dd>{importPreview.rejected} record(s)</dd></div>
              {importChanges && <><div><dt>New IDs</dt><dd>{importChanges.added}</dd></div><div><dt>Existing IDs</dt><dd>{importChanges.retained}</dd></div><div><dt>Removed IDs</dt><dd>{importChanges.removed}</dd></div></>}
              {importPreview.todos && <div><dt>Planning tasks</dt><dd>{importPreview.todos.length}</dd></div>}
            </dl>
            {importPreview.rejected > 0 && <p className="import-rejected">Records that failed validation will not be imported.</p>}
            <div className="import-confirmation-actions">
              <button type="button" onClick={exportCalendar}>Download current backup</button>
              <button type="button" onClick={() => setImportPreview(null)}>Cancel</button>
              <button type="button" className="danger" disabled={importPreview.events.length === 0} onClick={proceedWithImport}>Proceed anyway</button>
            </div>
          </section>
        </div>
      )}
      {editorOpen && <EventEditor event={editingEvent} semester={semester} onCancel={() => { setEditorOpen(false); setEditingEvent(null); }} onSave={saveEvent} />}
    </section>
  );
}
