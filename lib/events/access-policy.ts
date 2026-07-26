/**
 * Calendar roles describe the intended server-side policy for the future
 * authenticated application. These helpers are not an authorization boundary;
 * enforcement must happen again on every server read and mutation.
 */
export const CALENDAR_EDITOR_ROLES = [
  "president",
  "vice-president",
  "external-events-director",
  "internal-events-director",
  "content-publicity-director",
  "welfare-fundraising-manager",
  "secretary",
] as const;

export type CalendarEditorRole = (typeof CALENDAR_EDITOR_ROLES)[number];

export type CalendarPrincipal =
  | { kind: "visitor" }
  | { kind: "member"; role: "member" | CalendarEditorRole };

export type CalendarCapability = "view" | "edit";

export function calendarCapabilities(principal: CalendarPrincipal): Set<CalendarCapability> {
  if (principal.kind === "visitor") return new Set();

  const capabilities = new Set<CalendarCapability>(["view"]);
  if (CALENDAR_EDITOR_ROLES.includes(principal.role as CalendarEditorRole)) {
    capabilities.add("edit");
  }
  return capabilities;
}

