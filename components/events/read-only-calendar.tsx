"use client";

import { useEffect, useMemo, useState } from "react";
import { AY2627_WEEKS, academicDateToISO } from "@/lib/events/academic-calendar";
import { AY2627_PREVIEW_EVENTS } from "@/lib/events/ay2627-preview-data";
import { readLegacyLocalEvents, type LocalEventReadResult } from "@/lib/events/local-storage";
import {
  EVENT_STATUSES,
  EVENT_TEAMS,
  EVENT_TYPES,
  WEEKDAYS,
  type CalendarEvent,
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

export function ReadOnlyCalendar() {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [result, setResult] = useState<LocalEventReadResult>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [query, setQuery] = useState("");
  const [teamFilters, setTeamFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  useEffect(() => {
    try {
      setResult(readLegacyLocalEvents(window.localStorage));
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
  const sourceEvents = result.events.length ? result.events : AY2627_PREVIEW_EVENTS;
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

  return (
    <section className="calendar-migration" aria-labelledby="calendar-heading">
      <div className="calendar-toolbar">
        <div>
          <span className="status-tag">Public layout preview · Read only</span>
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
            <div>{EVENT_TEAMS.map((team) => <button type="button" className={`filter-chip team-${team} ${teamFilters.includes(team) ? "active" : ""}`} onClick={() => toggleFilter(team, teamFilters, setTeamFilters)} key={team}>{TEAM_META[team][0]} {TEAM_META[team][1]}</button>)}</div>
          </div>
          <div className="filter-group">
            <strong>Event Types:</strong>
            <div>{EVENT_TYPES.map((type) => <button type="button" className={`filter-chip type-${type} ${typeFilters.includes(type) ? "active" : ""}`} onClick={() => toggleFilter(type, typeFilters, setTypeFilters)} key={type}>{TYPE_META[type][0]} {TYPE_META[type][1]}</button>)}</div>
          </div>
          <div className="filter-group">
            <strong>Status:</strong>
            <div>{EVENT_STATUSES.map((status) => <button type="button" className={`filter-chip status-${status} ${statusFilters.includes(status) ? "active" : ""}`} onClick={() => toggleFilter(status, statusFilters, setStatusFilters)} key={status}>{STATUS_META[status][0]} {STATUS_META[status][1]}</button>)}</div>
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
      </div>

      {loaded && result.issues.length > 0 && (
        <div className="calendar-warning" role="status">
          Loaded {result.events.length} event(s); {result.rejected} record(s) could not be read. Your original saved data was not changed.
        </div>
      )}

      <div className="calendar-scroll">
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
      </div>

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
            <span className={`event-status status-${selected.planning.status}`}>{selected.planning.status}</span>
            <h3 id="event-dialog-title">{selected.public.name}</h3>
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
          </section>
        </div>
      )}
    </section>
  );
}
