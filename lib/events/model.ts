export const EVENT_TYPES = [
  "industry",
  "visit",
  "extpartner",
  "bonding",
  "external",
] as const;

export const EVENT_TEAMS = [
  "presidential",
  "finance",
  "hr",
  "publicity",
  "internal",
  "external",
  "allmembers",
] as const;

export const EVENT_STATUSES = [
  "potential",
  "contacted",
  "discussion",
  "confirmed",
  "completed",
  "declined",
] as const;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventTeam = (typeof EVENT_TEAMS)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type Weekday = (typeof WEEKDAYS)[number];

export type EventLink = { label: string; url: string };
export type EventImage = { name: string; src: string };

export type CalendarEvent = {
  schemaVersion: 1;
  id: string;
  legacyId: number | string | null;
  academicYear: "AY2026/27";
  public: {
    name: string;
    type: EventType;
    start: { weekId: string; day: Weekday };
    end: { weekId: string; day: Weekday } | null;
    allDay: boolean;
    startTime: string | null;
    endTime: string | null;
    venue: string;
    description: string;
    links: EventLink[];
  };
  planning: {
    teams: EventTeam[];
    status: EventStatus;
    expectedAttendance: number | null;
    actualAttendance: number | null;
    budget: number | null;
    images: EventImage[];
  };
};

/** User-editable fields; identifiers and audit metadata never come from forms. */
export type CalendarEventInput = Pick<CalendarEvent, "public" | "planning">;

export type NewCalendarEvent = CalendarEventInput;

export type CalendarEventUpdate = CalendarEventInput & {
  expectedRevision?: number;
};

/** Shape owned by a future shared store rather than by the browser editor. */
export type PersistedCalendarEvent = CalendarEvent & {
  revision: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

/** Untrusted shape accepted at the legacy local-storage/backup boundary. */
export type LegacyEventRecord = Record<string, unknown>;

export type NormalizationIssue = {
  field: string;
  message: string;
};

export type NormalizationResult =
  | { ok: true; event: CalendarEvent; issues: NormalizationIssue[] }
  | { ok: false; issues: NormalizationIssue[] };
