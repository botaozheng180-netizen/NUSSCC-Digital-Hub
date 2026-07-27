import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventEditor } from "@/components/events/event-editor";

describe("EventEditor", () => {
  it("submits editable input without persistence metadata", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EventEditor event={null} semester={1} onCancel={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByLabelText(/event name/i), "New workshop");
    await user.click(screen.getByLabelText(/all members/i));
    await user.click(screen.getByRole("button", { name: /save event/i }));
    expect(onSave).toHaveBeenCalledOnce();
    const input = onSave.mock.calls[0][0];
    expect(input.public.name).toBe("New workshop");
    expect(input.planning.teams).toEqual(["allmembers"]);
    expect(input).not.toHaveProperty("id");
    expect(input).not.toHaveProperty("revision");
  });

  it("rejects a multi-day event that ends before it starts", async () => {
    const user = userEvent.setup();
    render(<EventEditor event={null} semester={1} onCancel={vi.fn()} onSave={vi.fn()} />);
    await user.type(screen.getByLabelText(/event name/i), "Invalid range");
    await user.click(screen.getByLabelText(/all members/i));
    await user.click(screen.getByLabelText(/multi-day event/i));
    await user.selectOptions(screen.getByLabelText(/^academic week/i), "s1w2");
    await user.selectOptions(screen.getByLabelText(/^end week/i), "s1w1");
    await user.click(screen.getByRole("button", { name: /save event/i }));
    expect(screen.getByText(/end date must be on or after/i)).toBeInTheDocument();
  });

  it("warns before Escape discards a dirty form", async () => {
    const user = userEvent.setup();
    render(<EventEditor event={null} semester={1} onCancel={vi.fn()} onSave={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText(/event name/i)).toHaveFocus());
    await user.type(screen.getByLabelText(/event name/i), "Unsaved event");
    await user.keyboard("{Escape}");
    const warning = screen.getByRole("alertdialog", { name: /discard unsaved changes/i });
    expect(warning).toBeInTheDocument();
    expect(within(warning).getByRole("button", { name: /keep editing/i })).toHaveFocus();
  });
});
