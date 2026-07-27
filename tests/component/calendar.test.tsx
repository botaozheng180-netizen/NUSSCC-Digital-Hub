import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ReadOnlyCalendar } from "@/components/events/read-only-calendar";

describe("ReadOnlyCalendar", () => {
  it("filters preview events and opens details from agenda view", async () => {
    const user = userEvent.setup();
    render(<ReadOnlyCalendar />);
    await waitFor(() => expect(screen.getByText(/10 of 10 event/i)).toBeInTheDocument());
    await user.type(screen.getByLabelText(/search events/i), "Marvell");
    expect(screen.getByText(/1 of 10 event/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /agenda/i }));
    await user.click(screen.getByRole("button", { name: /Marvell/ }));
    const dialog = screen.getByRole("dialog", { name: /Marvell/ });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Company Visit/)).toBeInTheDocument();
    expect(within(dialog).getByText(/External Events/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Confirmed/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close event details/i })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /Marvell/ })).not.toBeInTheDocument();
  });

  it("previews a destructive import and allows cancellation", async () => {
    const user = userEvent.setup();
    render(<ReadOnlyCalendar />);
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    const backup = new File([JSON.stringify({ version: 1, ay: "AY2026/27", events: [{ id: 500, name: "Imported", type: "bonding", cats: ["allmembers"], status: "confirmed", weekId: "s1w1", day: "Mon" }] })], "backup.json", { type: "application/json" });
    await user.upload(fileInput!, backup);
    const warning = await screen.findByRole("alertdialog", { name: /overwrite the current calendar/i });
    expect(within(warning).getByText(/replace every event/i)).toBeInTheDocument();
    expect(within(warning).getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(within(warning).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("nus_semicon_events_ay2627")).toBeNull();
  });

  it("traps focus and restores it after closing event details", async () => {
    const user = userEvent.setup();
    render(<ReadOnlyCalendar />);
    const eventButton = await screen.findByRole("button", { name: /Welcome \(Bonding\)/ });
    await user.click(eventButton);
    const close = screen.getByRole("button", { name: /close event details/i });
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Close", exact: true })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.click(close);
    await waitFor(() => expect(eventButton).toHaveFocus());
  });
});
