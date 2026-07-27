import { normalizeLegacyEvent } from "./normalize-legacy";
import { academicDateToISO } from "./academic-calendar";
import type { CalendarEvent, NormalizationIssue } from "./model";

export const LEGACY_TODOS_STORAGE_KEY = "nus_semicon_todos_ay2627";
export const LEGACY_EDIT_TIMESTAMP_KEY = "nus_semicon_last_edit_ay2627";
export const LEGACY_BACKUP_TIMESTAMP_KEY = "nus_semicon_last_backup_ay2627";

export type CalendarBackup = {
  version: 1;
  exported: string;
  club: "NUS Semiconductor Club";
  ay: "AY2026/27";
  events: ReturnType<typeof toLegacyEvent>[];
  todos: unknown[];
};

export type ImportPreview = {
  events: CalendarEvent[];
  todos: unknown[] | null;
  issues: NormalizationIssue[];
  rejected: number;
};

export function toLegacyEvent(event: CalendarEvent) {
  return {
    id: event.legacyId ?? event.id,
    weekId: event.public.start.weekId,
    day: event.public.start.day,
    endWeekId: event.public.end?.weekId ?? null,
    endDay: event.public.end?.day ?? null,
    allDay: event.public.allDay,
    startTime: event.public.startTime,
    endTime: event.public.endTime,
    type: event.public.type,
    cats: event.planning.teams,
    status: event.planning.status,
    name: event.public.name,
    venue: event.public.venue,
    desc: event.public.description,
    expected: event.planning.expectedAttendance,
    actual: event.planning.actualAttendance,
    budget: event.planning.budget,
    links: event.public.links,
    images: event.planning.images,
    synced: false,
  };
}

export function createCalendarBackup(events: CalendarEvent[], todos: unknown[], now = new Date()): CalendarBackup {
  return {
    version: 1,
    exported: now.toISOString(),
    club: "NUS Semiconductor Club",
    ay: "AY2026/27",
    events: events.map(toLegacyEvent),
    todos,
  };
}

export function previewCalendarImport(value: unknown): ImportPreview {
  const wrapped = !Array.isArray(value) && value && typeof value === "object"
    ? value as Record<string, unknown>
    : null;
  const records = Array.isArray(value) ? value : wrapped?.events;
  if (!Array.isArray(records)) throw new Error("This file does not contain a valid event array.");
  if (wrapped?.version !== undefined && wrapped.version !== 1) throw new Error(`Backup version ${String(wrapped.version)} is not supported.`);
  if (wrapped?.ay !== undefined && wrapped.ay !== "AY2026/27") throw new Error(`This backup is for ${String(wrapped.ay)}, not AY2026/27.`);

  const preview: ImportPreview = {
    events: [],
    todos: wrapped && Array.isArray(wrapped.todos) ? wrapped.todos : null,
    issues: [],
    rejected: 0,
  };
  const ids = new Set<number | string>();
  records.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      preview.rejected += 1;
      preview.issues.push({ field: `events[${index}]`, message: "Event is not an object." });
      return;
    }
    const result = normalizeLegacyEvent(record as Record<string, unknown>);
    if (!result.ok) {
      preview.rejected += 1;
      preview.issues.push(...result.issues.map((issue) => ({ ...issue, field: `events[${index}].${issue.field}` })));
      return;
    }
    if (result.event.legacyId !== null && ids.has(result.event.legacyId)) {
      preview.rejected += 1;
      preview.issues.push({ field: `events[${index}].id`, message: "Duplicate event ID." });
      return;
    }
    if (result.event.legacyId !== null) ids.add(result.event.legacyId);
    preview.events.push(result.event);
    preview.issues.push(...result.issues.map((issue) => ({ ...issue, field: `events[${index}].${issue.field}` })));
  });
  return preview;
}

const icsEscape = (value: string) => value
  .split("\\").join("\\\\")
  .split("\n").join("\\n")
  .split(",").join("\\,")
  .split(";").join("\\;");

const compactDate = (value: string) => value.split("-").join("");
const foldICSLine = (line: string) => {
  const chunks: string[] = [];
  for (let index = 0; index < line.length; index += 74) chunks.push(`${index ? " " : ""}${line.slice(index, index + 74)}`);
  return chunks.join("\r\n");
};

function nextISODate(value: string) {
  const [year, month, date] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + 1)).toISOString().slice(0, 10);
}

/** Builds the legacy-compatible bulk calendar export in Singapore time. */
export function buildCalendarICS(events: CalendarEvent[], generatedAt = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//NUS Semiconductor Club//Event Calendar AY2026-27//EN",
    "CALSCALE:GREGORIAN", "X-WR-CALNAME:NUS Semiconductor Club AY2026/27",
    "X-WR-TIMEZONE:Asia/Singapore",
  ];
  events.filter((event) => event.planning.status !== "declined").forEach((event) => {
    const start = academicDateToISO(event.public.start.weekId, event.public.start.day);
    const end = event.public.end ? academicDateToISO(event.public.end.weekId, event.public.end.day) : start;
    if (!start || !end) return;
    const tentative = ["potential", "contacted", "discussion"].includes(event.planning.status);
    const summary = `${tentative ? "[TENTATIVE] " : ""}[NUS SemiCon] ${event.public.name}`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:nusscc-ay2627-${encodeURIComponent(String(event.legacyId ?? event.id))}@nussemiconductorclub`);
    lines.push(`DTSTAMP:${generatedAt.toISOString().replace(/\.\d{3}Z$/, "Z").split("-").join("").split(":").join("")}`);
    if (event.public.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(start)}`);
      lines.push(`DTEND;VALUE=DATE:${compactDate(nextISODate(end))}`);
    } else {
      const startTime = (event.public.startTime ?? "00:00").replace(":", "");
      const endTime = (event.public.endTime ?? event.public.startTime ?? "00:00").replace(":", "");
      lines.push(`DTSTART;TZID=Asia/Singapore:${compactDate(start)}T${startTime}00`);
      lines.push(`DTEND;TZID=Asia/Singapore:${compactDate(end)}T${endTime}00`);
    }
    lines.push(`SUMMARY:${icsEscape(summary)}`);
    lines.push(`DESCRIPTION:${icsEscape([event.public.description, `Team: ${event.planning.teams.join(", ")}`].filter(Boolean).join("\n"))}`);
    if (event.public.venue) lines.push(`LOCATION:${icsEscape(event.public.venue)}`);
    lines.push(`STATUS:${tentative ? "TENTATIVE" : "CONFIRMED"}`, "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.map(foldICSLine).join("\r\n");
}
