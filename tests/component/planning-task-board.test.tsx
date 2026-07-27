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
    await user.type(screen.getByLabelText(/Due date/), "2026-08-10");
    await user.type(screen.getByLabelText("Owner"), "Taylor");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ text: "Confirm attendance", eventLegacyId: 112, due: "2026-08-10", owner: "Taylor" });
  });

  it("uses an English ISO date field and reports invalid dates in English", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlanningTaskBoard events={AY2627_PREVIEW_EVENTS} tasks={[]} onChange={onChange} />);
    const dueDate = screen.getByLabelText(/Due date/);
    expect(dueDate).toHaveAttribute("type", "text");
    expect(dueDate).toHaveAttribute("placeholder", "YYYY-MM-DD");
    await user.type(screen.getByLabelText("Task"), "Invalid date task");
    await user.type(dueDate, "27/07/2026");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter the due date in YYYY-MM-DD format.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects a due date from an English calendar dialog", async () => {
    const user = userEvent.setup();
    render(<PlanningTaskBoard events={AY2627_PREVIEW_EVENTS} tasks={[]} onChange={vi.fn()} />);
    const dueDate = screen.getByLabelText(/Due date \(YYYY-MM-DD\)/);
    await user.type(dueDate, "2026-08-10");
    await user.click(screen.getByRole("button", { name: "Choose due date" }));
    const picker = screen.getByRole("dialog", { name: "August 2026" });
    expect(picker).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Mon" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Sun" })).toBeInTheDocument();
    await user.click(screen.getByRole("gridcell", { name: "Choose Wednesday, August 12, 2026" }));
    expect(dueDate).toHaveValue("2026-08-12");
    expect(screen.queryByRole("dialog", { name: "August 2026" })).not.toBeInTheDocument();
  });
});
