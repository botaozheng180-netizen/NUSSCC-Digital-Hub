import { describe, expect, it } from "vitest";
import { normalizePlanningTask, readPlanningTasks, writePlanningTasks } from "@/lib/events/planning-tasks";

describe("EXCO planning task compatibility", () => {
  it("normalizes and preserves linked task data", () => {
    const task = normalizePlanningTask({ id: 7, text: " Book venue ", cats: ["internal"], eventId: 106, due: "2026-10-01", owner: "Alex", desc: "Call", links: [{ url: "https://example.com" }], images: ["data:image/png;base64,x"] });
    expect(task).not.toBeNull();
    writePlanningTasks(window.localStorage, [task!]);
    expect(readPlanningTasks(window.localStorage)[0]).toMatchObject({ text: "Book venue", eventLegacyId: 106, owner: "Alex" });
    expect(readPlanningTasks(window.localStorage)[0].links).toHaveLength(1);
    expect(readPlanningTasks(window.localStorage)[0].images).toHaveLength(1);
  });
});
