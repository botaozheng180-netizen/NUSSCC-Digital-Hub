import type { CalendarEvent, EventStatus, EventTeam, EventType, Weekday } from "./model";

type PreviewEvent = {
  id: number;
  name: string;
  type: EventType;
  teams: EventTeam[];
  status?: EventStatus;
  weekId: string;
  day: Weekday;
  endWeekId?: string;
  endDay?: Weekday;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  venue?: string;
  description?: string;
  links?: { label: string; url: string }[];
};

const preview = (event: PreviewEvent): CalendarEvent => ({
  schemaVersion: 1,
  id: `preview-ay2627-${event.id}`,
  legacyId: event.id,
  academicYear: "AY2026/27",
  public: {
    name: event.name,
    type: event.type,
    start: { weekId: event.weekId, day: event.day },
    end: event.endWeekId && event.endDay ? { weekId: event.endWeekId, day: event.endDay } : null,
    allDay: event.allDay ?? false,
    startTime: event.allDay ? null : event.startTime ?? null,
    endTime: event.allDay ? null : event.endTime ?? null,
    venue: event.venue ?? "",
    description: event.description ?? "",
    links: event.links ?? [],
  },
  planning: {
    teams: event.teams,
    status: event.status ?? "confirmed",
    expectedAttendance: null,
    actualAttendance: null,
    budget: null,
    images: [],
  },
});

/**
 * Temporary layout-preview snapshot supplied on 26 July 2026 at 11:50 SGT.
 * Replace this module with the authenticated shared source before access control
 * is enabled; it deliberately contains no budget, attendance, task, or image data.
 */
export const AY2627_PREVIEW_EVENTS: CalendarEvent[] = [
  preview({ id: 1, name: "Welcome (Bonding)", type: "bonding", teams: ["allmembers"], weekId: "s1w1", day: "Wed", startTime: "14:00", endTime: "16:00", venue: "CLB Seminar Room", description: "Kick off AY2026/27 with games, introductions and a semester preview." }),
  preview({ id: 100, name: "SSIA Semiconductor Awareness Day @ NUS", type: "extpartner", teams: ["allmembers"], weekId: "s1w3", day: "Wed", startTime: "10:00", endTime: "17:00", venue: "NUS E6", links: [{ label: "Event information", url: "https://ssia.org.sg/semiconductor-awareness-days/" }, { label: "Semiconductor overview", url: "https://ssia.org.sg/wp-content/uploads/semiconductor-overview.pdf" }] }),
  preview({ id: 101, name: "IEEE Electronic Components and Technology Conference (ECTC)", type: "extpartner", teams: ["allmembers"], weekId: "s1e1_2", day: "Thu", endWeekId: "s1e1_2", endDay: "Sun", allDay: true, venue: "MBS Sands Conference" }),
  preview({ id: 102, name: "A*STAR IME", type: "visit", teams: ["external"], status: "potential", weekId: "s2w1", day: "Mon", startTime: "14:00", endTime: "16:00" }),
  preview({ id: 103, name: "E6 Nano Fab (NUS Visit)", type: "industry", teams: ["internal"], status: "potential", weekId: "s2w1", day: "Mon", startTime: "14:00", endTime: "16:00", venue: "NUS E6" }),
  preview({ id: 104, name: "Micron (Company Visit)", type: "visit", teams: ["external"], status: "discussion", weekId: "s1vac_1", day: "Tue", startTime: "14:00", endTime: "17:00", description: "Memory company" }),
  preview({ id: 105, name: "Members Photoshoot", type: "bonding", teams: ["presidential"], weekId: "s1w1", day: "Wed", startTime: "14:00", endTime: "16:00" }),
  preview({ id: 106, name: "SSMC (Company Talk)", type: "industry", teams: ["internal"], weekId: "s1w12", day: "Wed", startTime: "14:00", endTime: "16:00" }),
  preview({ id: 107, name: "SiliconBox", type: "industry", teams: ["internal"], weekId: "s1w2", day: "Wed", startTime: "14:00", endTime: "16:00", venue: "SDE3-LT427" }),
  preview({ id: 108, name: "Lam Research", type: "visit", teams: ["external"], status: "discussion", weekId: "s1w8", day: "Wed", startTime: "14:00", endTime: "17:00", description: "Equipment company" }),
  preview({ id: 109, name: "GF: Talk", type: "industry", teams: ["internal"], status: "potential", weekId: "s2w1", day: "Mon", startTime: "14:00", endTime: "16:00" }),
  preview({ id: 110, name: "TSMC – Technical (Dr Chuang)", type: "industry", teams: ["internal"], status: "potential", weekId: "s2w1", day: "Mon", startTime: "14:00", endTime: "16:00" }),
  preview({ id: 111, name: "End of Calendar Year – Bonding", type: "bonding", teams: ["presidential", "hr"], weekId: "s2vac_1", day: "Mon", startTime: "14:00", endTime: "16:00" }),
  preview({ id: 112, name: "Marvell (Company Visit)", type: "visit", teams: ["external"], weekId: "s1w2", day: "Tue", startTime: "13:00", endTime: "17:15" }),
  preview({ id: 113, name: "STATS ChipPAC", type: "visit", teams: ["external"], weekId: "s1wr_1", day: "Wed", startTime: "13:00", endTime: "16:00" }),
];
