import { normalizeLegacyEvent } from "./normalize-legacy";
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

  const preview: ImportPreview = {
    events: [],
    todos: wrapped && Array.isArray(wrapped.todos) ? wrapped.todos : null,
    issues: [],
    rejected: 0,
  };
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
    preview.events.push(result.event);
    preview.issues.push(...result.issues.map((issue) => ({ ...issue, field: `events[${index}].${issue.field}` })));
  });
  return preview;
}

