import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlanningTaskBoard } from "@/components/events/planning-task-board";
import { AY2627_PREVIEW_EVENTS } from "@/lib/events/ay2627-preview-data";

describe("PlanningTaskBoard", () => {
  it("creates a task linked to the chosen event", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlanningTaskBoard events={AY2627_PREVIEW_EVENTS} tasks={[]} onChange={onChange} />);
    await user.type(screen.getByLabelText("Task"), "Confirm attendance");
    await user.selectOptions(screen.getByLabelText("Linked event"), "112");
    await user.type(screen.getByLabelText("Owner"), "Taylor");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ text: "Confirm attendance", eventLegacyId: 112, owner: "Taylor" });
  });
});
