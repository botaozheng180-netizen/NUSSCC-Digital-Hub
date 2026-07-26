import { normalizeLegacyEvent } from "./normalize-legacy";
import type { CalendarEvent, NormalizationIssue } from "./model";

export const LEGACY_EVENTS_STORAGE_KEY = "nus_semicon_events_ay2627";

export type LocalEventReadResult = {
  events: CalendarEvent[];
  rejected: number;
  issues: NormalizationIssue[];
  source: "empty" | "legacy-local-storage";
};

/** Reads and normalizes legacy data without modifying any browser storage. */
export function readLegacyLocalEvents(storage: Pick<Storage, "getItem">): LocalEventReadResult {
  const raw = storage.getItem(LEGACY_EVENTS_STORAGE_KEY);
  if (!raw) return { events: [], rejected: 0, issues: [], source: "empty" };

  let records: unknown;
  try {
    records = JSON.parse(raw);
  } catch {
    return {
      events: [],
      rejected: 1,
      issues: [{ field: "storage", message: "The saved calendar is not valid JSON." }],
      source: "legacy-local-storage",
    };
  }

  if (!Array.isArray(records)) {
    return {
      events: [],
      rejected: 1,
      issues: [{ field: "storage", message: "The saved calendar must contain an event array." }],
      source: "legacy-local-storage",
    };
  }

  const result: LocalEventReadResult = {
    events: [],
    rejected: 0,
    issues: [],
    source: "legacy-local-storage",
  };
  records.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      result.rejected += 1;
      result.issues.push({ field: `events[${index}]`, message: "Event is not an object." });
      return;
    }
    const normalized = normalizeLegacyEvent(record as Record<string, unknown>);
    if (!normalized.ok) {
      result.rejected += 1;
      result.issues.push(...normalized.issues.map((issue) => ({ ...issue, field: `events[${index}].${issue.field}` })));
      return;
    }
    result.events.push(normalized.event);
    result.issues.push(...normalized.issues.map((issue) => ({ ...issue, field: `events[${index}].${issue.field}` })));
  });
  return result;
}

