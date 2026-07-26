"use client";

import { useRef, useState } from "react";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { AY2627_WEEKS, academicDateToISO } from "@/lib/events/academic-calendar";
import {
  EVENT_STATUSES,
  EVENT_TEAMS,
  EVENT_TYPES,
  WEEKDAYS,
  type CalendarEvent,
  type CalendarEventInput,
  type EventStatus,
  type EventTeam,
  type EventType,
  type Weekday,
} from "@/lib/events/model";

const LABELS = {
  types: { industry: "Company Talk", visit: "Company Visit", extpartner: "External Partners", bonding: "Club Bonding", external: "Others" },
  teams: { presidential: "Presidential Cell", finance: "Finance", hr: "Human Resources & Welfare", publicity: "Publicity", internal: "Internal Events", external: "External Events", allmembers: "All Members" },
  statuses: { potential: "Potential / Sourcing", contacted: "Outreach Sent", discussion: "In Discussion", confirmed: "Confirmed", completed: "Completed", declined: "Declined / Cancelled" },
} as const;

type Props = {
  event: CalendarEvent | null;
  semester: 1 | 2;
  onCancel: () => void;
  onSave: (input: CalendarEventInput) => void;
};

export function EventEditor({ event, semester, onCancel, onSave }: Props) {
  const initialWeek = AY2627_WEEKS.find((week) => week.semester === semester)?.id ?? "s1w0";
  const [name, setName] = useState(event?.public.name ?? "");
  const [type, setType] = useState<EventType>(event?.public.type ?? "industry");
  const [teams, setTeams] = useState<EventTeam[]>(event?.planning.teams ?? []);
  const [status, setStatus] = useState<EventStatus>(event?.planning.status ?? "confirmed");
  const [weekId, setWeekId] = useState(event?.public.start.weekId ?? initialWeek);
  const [day, setDay] = useState<Weekday>(event?.public.start.day ?? "Mon");
  const [multiDay, setMultiDay] = useState(Boolean(event?.public.end));
  const [endWeekId, setEndWeekId] = useState(event?.public.end?.weekId ?? event?.public.start.weekId ?? initialWeek);
  const [endDay, setEndDay] = useState<Weekday>(event?.public.end?.day ?? event?.public.start.day ?? "Mon");
  const [allDay, setAllDay] = useState(event?.public.allDay ?? false);
  const [startTime, setStartTime] = useState(event?.public.startTime ?? "14:00");
  const [endTime, setEndTime] = useState(event?.public.endTime ?? "16:00");
  const [venue, setVenue] = useState(event?.public.venue ?? "");
  const [description, setDescription] = useState(event?.public.description ?? "");
  const [expected, setExpected] = useState(event?.planning.expectedAttendance?.toString() ?? "");
  const [budget, setBudget] = useState(event?.planning.budget?.toString() ?? "");
  const [validation, setValidation] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const discardRef = useRef<HTMLButtonElement>(null);
  const initial = useRef(JSON.stringify({ name, type, teams, status, weekId, day, multiDay, endWeekId, endDay, allDay, startTime, endTime, venue, description, expected, budget }));
  const dirty = initial.current !== JSON.stringify({ name, type, teams, status, weekId, day, multiDay, endWeekId, endDay, allDay, startTime, endTime, venue, description, expected, budget });
  const requestClose = () => dirty ? setConfirmDiscard(true) : onCancel();

  const submit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!name.trim()) { setValidation("Enter an event name."); nameRef.current?.focus(); return; }
    if (teams.length === 0) { setValidation("Choose at least one managing team."); return; }
    if (multiDay) {
      const start = academicDateToISO(weekId, day);
      const end = academicDateToISO(endWeekId, endDay);
      if (!start || !end || end < start) {
        setValidation("The end date must be on or after the start date.");
        return;
      }
    }
    onSave({
      public: {
        name: name.trim(), type, start: { weekId, day }, end: multiDay ? { weekId: endWeekId, day: endDay } : null, allDay,
        startTime: allDay ? null : startTime || null,
        endTime: allDay ? null : endTime || null,
        venue: venue.trim(), description: description.trim(), links: event?.public.links ?? [],
      },
      planning: {
        teams, status,
        expectedAttendance: expected === "" ? null : Number(expected),
        actualAttendance: event?.planning.actualAttendance ?? null,
        budget: budget === "" ? null : Number(budget),
        images: event?.planning.images ?? [],
      },
    });
  };

  return (
    <AccessibleDialog className="event-editor" labelledBy="editor-title" describedBy="editor-notice" onClose={() => confirmDiscard ? setConfirmDiscard(false) : requestClose()} initialFocusRef={nameRef}>
      <form onSubmit={submit} inert={confirmDiscard ? true : undefined}>
        <button className="event-dialog-close" type="button" onClick={requestClose} aria-label="Close editor">×</button>
        <span className="status-tag">Browser-local editor</span>
        <h3 id="editor-title">{event ? "Edit event" : "Add event"}</h3>
        <p className="editor-notice" id="editor-notice">Changes currently save only in this browser. Shared EXCO editing will replace this storage adapter later.</p>
        <div className="editor-grid">
          <label className="wide"><span>Event name *</span><input ref={nameRef} value={name} onChange={(e) => { setName(e.target.value); setValidation(""); }} required aria-invalid={validation === "Enter an event name."} aria-describedby={validation === "Enter an event name." ? "editor-validation" : undefined} /></label>
          <label><span>Event type</span><select value={type} onChange={(e) => setType(e.target.value as EventType)}>{EVENT_TYPES.map((value) => <option value={value} key={value}>{LABELS.types[value]}</option>)}</select></label>
          <label><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)}>{EVENT_STATUSES.map((value) => <option value={value} key={value}>{LABELS.statuses[value]}</option>)}</select></label>
          <fieldset className="wide" aria-invalid={teams.length === 0} aria-describedby={teams.length === 0 && validation ? "editor-validation" : undefined}><legend>Managing team *</legend><div className="editor-team-options">{EVENT_TEAMS.map((team) => <label key={team}><input type="checkbox" checked={teams.includes(team)} onChange={() => { setTeams(teams.includes(team) ? teams.filter((item) => item !== team) : [...teams, team]); setValidation(""); }} /> {LABELS.teams[team]}</label>)}</div></fieldset>
          <label><span>Academic week</span><select value={weekId} onChange={(e) => setWeekId(e.target.value)}>{AY2627_WEEKS.map((week) => <option value={week.id} key={week.id}>Sem {week.semester} · {week.label}</option>)}</select></label>
          <label><span>Day</span><select value={day} onChange={(e) => setDay(e.target.value as Weekday)}>{WEEKDAYS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="editor-check wide"><input type="checkbox" checked={multiDay} onChange={(e) => setMultiDay(e.target.checked)} /> Multi-day event</label>
          {multiDay && <><label><span>End week</span><select value={endWeekId} onChange={(e) => setEndWeekId(e.target.value)}>{AY2627_WEEKS.map((week) => <option value={week.id} key={week.id}>Sem {week.semester} · {week.label}</option>)}</select></label><label><span>End day</span><select value={endDay} onChange={(e) => setEndDay(e.target.value as Weekday)}>{WEEKDAYS.map((value) => <option key={value}>{value}</option>)}</select></label></>}
          <label className="editor-check"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All-day event</label>
          <span />
          {!allDay && <><label><span>Start time</span><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label><label><span>End time</span><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label></>}
          <label className="wide"><span>Venue</span><input value={venue} onChange={(e) => setVenue(e.target.value)} /></label>
          <label><span>Expected attendance</span><input type="number" min="0" value={expected} onChange={(e) => setExpected(e.target.value)} /></label>
          <label><span>Budget (S$)</span><input type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} /></label>
          <label className="wide"><span>Description</span><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        </div>
        {validation && <p className="editor-validation" id="editor-validation" role="alert">{validation}</p>}
        <div className="event-dialog-actions"><button type="button" onClick={requestClose}>Cancel</button><button type="submit" className="save">Save event</button></div>
      </form>
      {confirmDiscard && <div className="dialog-inline-confirm" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description" onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setConfirmDiscard(false); }
        if (event.key !== "Tab") return;
        if (event.shiftKey && document.activeElement === keepEditingRef.current) { event.preventDefault(); discardRef.current?.focus(); }
        else if (!event.shiftKey && document.activeElement === discardRef.current) { event.preventDefault(); keepEditingRef.current?.focus(); }
      }}><h4 id="discard-title">Discard unsaved changes?</h4><p id="discard-description">Your changes to this event have not been saved.</p><div><button ref={keepEditingRef} autoFocus type="button" onClick={() => setConfirmDiscard(false)}>Keep editing</button><button ref={discardRef} type="button" className="danger" onClick={onCancel}>Discard changes</button></div></div>}
    </AccessibleDialog>
  );
}
