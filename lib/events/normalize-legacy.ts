import { AY2627_WEEKS } from "./academic-calendar";
import {
  EVENT_STATUSES,
  EVENT_TEAMS,
  EVENT_TYPES,
  WEEKDAYS,
  type CalendarEvent,
  type EventImage,
  type EventLink,
  type LegacyEventRecord,
  type NormalizationIssue,
  type NormalizationResult,
} from "./model";

const weekIds = new Set(AY2627_WEEKS.map(({ id }) => id));
const has = <T extends readonly string[]>(values: T, value: unknown): value is T[number] =>
  typeof value === "string" && values.includes(value as T[number]);
const text = (value: unknown) => (typeof value === "string" ? value : "");
const nullableNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function links(value: unknown): EventLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const link = item as Record<string, unknown>;
    return typeof link.url === "string" ? [{ label: text(link.label), url: link.url }] : [];
  });
}

function images(value: unknown): EventImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (typeof item === "string") return [{ name: `Image ${index + 1}`, src: item }];
    if (!item || typeof item !== "object") return [];
    const image = item as Record<string, unknown>;
    return typeof image.src === "string"
      ? [{ name: text(image.name) || `Image ${index + 1}`, src: image.src }]
      : [];
  });
}

export function normalizeLegacyEvent(record: LegacyEventRecord): NormalizationResult {
  const issues: NormalizationIssue[] = [];
  const legacyId = typeof record.id === "number" || typeof record.id === "string" ? record.id : null;
  if (!text(record.name).trim()) issues.push({ field: "name", message: "Event name is required." });
  if (!weekIds.has(text(record.weekId))) issues.push({ field: "weekId", message: "Academic week is not recognized." });
  if (!has(WEEKDAYS, record.day)) issues.push({ field: "day", message: "Weekday is not recognized." });
  if (issues.length) return { ok: false, issues };

  const rawTeams = Array.isArray(record.cats) ? record.cats : record.cat ? [record.cat] : [];
  const teams = rawTeams.filter((team): team is CalendarEvent["planning"]["teams"][number] => has(EVENT_TEAMS, team));
  if (teams.length !== rawTeams.length) issues.push({ field: "teams", message: "Unknown managing teams were omitted." });

  const hasEnd = weekIds.has(text(record.endWeekId)) && has(WEEKDAYS, record.endDay);
  return {
    ok: true,
    issues,
    event: {
      schemaVersion: 1,
      id: legacyId === null ? `legacy-ay2627-unidentified` : `legacy-ay2627-${legacyId}`,
      legacyId,
      academicYear: "AY2026/27",
      public: {
        name: text(record.name).trim(),
        type: has(EVENT_TYPES, record.type) ? record.type : "external",
        start: { weekId: text(record.weekId), day: record.day as CalendarEvent["public"]["start"]["day"] },
        end: hasEnd ? { weekId: text(record.endWeekId), day: record.endDay as CalendarEvent["public"]["start"]["day"] } : null,
        allDay: record.allDay === true,
        startTime: record.allDay === true ? null : text(record.startTime) || null,
        endTime: record.allDay === true ? null : text(record.endTime) || null,
        venue: text(record.venue),
        description: text(record.desc),
        links: links(record.links),
      },
      planning: {
        teams,
        status: has(EVENT_STATUSES, record.status) ? record.status : "confirmed",
        expectedAttendance: nullableNumber(record.expected),
        actualAttendance: nullableNumber(record.actual),
        budget: nullableNumber(record.budget),
        images: images(record.images),
      },
    },
  };
}
