"use client";

import { useEffect, useMemo, useState } from "react";
import { AY2627_WEEKS, academicDateToISO } from "@/lib/events/academic-calendar";
import { readLegacyLocalEvents, type LocalEventReadResult } from "@/lib/events/local-storage";
import { WEEKDAYS, type CalendarEvent } from "@/lib/events/model";

const EMPTY: LocalEventReadResult = { events: [], rejected: 0, issues: [], source: "empty" };

function eventDate(event: CalendarEvent) {
  return academicDateToISO(event.public.start.weekId, event.public.start.day) ?? "";
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
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    result.events.forEach((event) => {
      const date = eventDate(event);
      if (!date) return;
      map.set(date, [...(map.get(date) ?? []), event]);
    });
    return map;
  }, [result.events]);

  return (
    <section className="calendar-migration" aria-labelledby="calendar-heading">
      <div className="calendar-toolbar">
        <div>
          <span className="status-tag">Read-only migration preview</span>
          <h2 id="calendar-heading">AY2026/27 academic calendar</h2>
          <p>Reads the original calendar data from this browser without changing it.</p>
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

      {loaded && result.issues.length > 0 && (
        <div className="calendar-warning" role="status">
          Loaded {result.events.length} event(s); {result.rejected} record(s) could not be read. Your original saved data was not changed.
        </div>
      )}

      {loaded && result.events.length === 0 ? (
        <div className="calendar-empty">
          <strong>No browser-local events found</strong>
          <p>
            This preview intentionally does not publish the supplied internal calendar. A signed-in, server-backed source will be added in a later migration stage.
          </p>
        </div>
      ) : (
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
                      <article className={`calendar-event status-${event.planning.status}`} key={event.id}>
                        <strong>{event.public.name}</strong>
                        <span>{timeLabel(event)}</span>
                      </article>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

