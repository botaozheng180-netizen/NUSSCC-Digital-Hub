/** This models the intended policy; the future server must enforce it. */
export type CalendarPrincipal =
  | { kind: "visitor" }
  | { kind: "member"; isExco: boolean; delegatedCalendarEditor: boolean };

export type CalendarCapability = "view" | "edit";

export function calendarCapabilities(principal: CalendarPrincipal): Set<CalendarCapability> {
  if (principal.kind === "visitor") return new Set();

  const capabilities = new Set<CalendarCapability>(["view"]);
  if (principal.isExco || principal.delegatedCalendarEditor) {
    capabilities.add("edit");
  }
  return capabilities;
}
