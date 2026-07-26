import { describe, expect, it } from "vitest";
import { AY2627_WEEKS, academicDateToISO } from "@/lib/events/academic-calendar";
import { AY2627_PREVIEW_EVENTS } from "@/lib/events/ay2627-preview-data";
import { LocalStorageEventRepository } from "@/lib/events/event-repository";
import { buildCalendarICS, createCalendarBackup, previewCalendarImport } from "@/lib/events/import-export";
import { normalizeLegacyEvent } from "@/lib/events/normalize-legacy";

describe("AY2026/27 calendar domain", () => {
  it("keeps all academic rows unique and resolves representative dates", () => {
    expect(AY2627_WEEKS).toHaveLength(58);
    expect(new Set(AY2627_WEEKS.map((week) => week.id)).size).toBe(58);
    expect(academicDateToISO("s1w1", "Wed")).toBe("2026-08-12");
    expect(academicDateToISO("s1wr_2", "Sun")).toBeNull();
    expect(academicDateToISO("s2vac_1", "Mon")).toBe("2027-05-09");
  });

  it("normalizes old single-team records and legacy defaults", () => {
    const result = normalizeLegacyEvent({ id: 9, name: "Legacy", cat: "external", weekId: "s1w1", day: "Mon", type: "removed-type" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.planning.teams).toEqual(["external"]);
    expect(result.event.planning.status).toBe("confirmed");
    expect(result.event.public.type).toBe("external");
  });

  it("round-trips JSON backups and rejects unsafe metadata and duplicates", () => {
    const backup = createCalendarBackup(AY2627_PREVIEW_EVENTS, [{ id: 1, text: "Task" }], new Date("2026-07-26T03:50:00Z"));
    expect(previewCalendarImport(backup).events).toHaveLength(15);
    expect(previewCalendarImport([backup.events[0], backup.events[0]]).rejected).toBe(1);
    expect(() => previewCalendarImport({ version: 2, events: [] })).toThrow(/version/i);
    expect(() => previewCalendarImport({ version: 1, ay: "AY2025\/26", events: [] })).toThrow(/AY2025\/26/);
  });

  it("exports timed, tentative, and all-day events to ICS", () => {
    const ics = buildCalendarICS(AY2627_PREVIEW_EVENTS, new Date("2026-07-26T03:49:42Z"));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(15);
    expect(ics).toContain("DTSTART;TZID=Asia/Singapore:20260812T140000");
    expect(ics).toContain("DTEND;VALUE=DATE:20261205");
    expect(ics).toContain("STATUS:TENTATIVE");
  });

  it("owns CRUD metadata behind the repository boundary", () => {
    const repository = new LocalStorageEventRepository(window.localStorage, {
      fallbackEvents: AY2627_PREVIEW_EVENTS,
      createId: () => "unit-id",
      now: () => new Date("2026-07-26T00:00:00Z"),
    });
    const input = { public: { ...AY2627_PREVIEW_EVENTS[0].public, name: "Created" }, planning: AY2627_PREVIEW_EVENTS[0].planning };
    repository.create(input);
    expect(repository.list()).toHaveLength(16);
    const created = repository.list().find((event) => event.legacyId === "local-ay2627-unit-id")!;
    repository.update(created.id, { ...input, public: { ...input.public, name: "Updated" } });
    expect(repository.list().some((event) => event.public.name === "Updated")).toBe(true);
    repository.delete(created.id);
    expect(repository.list()).toHaveLength(15);
  });
});
