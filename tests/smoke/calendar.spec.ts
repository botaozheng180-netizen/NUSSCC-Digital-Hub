import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/calendar");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("separates public Events from the internal Calendar", async ({ page }) => {
  await page.goto("/events");
  await expect(page.getByRole("heading", { name: /Find your next NUSSCC experience/ })).toBeVisible();
  await expect(page.getByText(/Upcoming public events/)).toBeVisible();
  await page.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("heading", { name: /AY2026\/27 academic calendar/ })).toBeVisible();
});

test("searches, filters, switches to agenda, and opens event details", async ({ page }) => {
  await page.getByRole("searchbox", { name: /Search events/ }).fill("Marvell");
  await expect(page.getByText("1 of 10 event(s)")).toBeVisible();
  await page.getByRole("button", { name: /Agenda/ }).click();
  await page.getByRole("button", { name: /Marvell/ }).click();
  const dialog = page.getByRole("dialog", { name: /Marvell/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Company Visit/)).toBeVisible();
  await expect(dialog.getByText(/External Events/)).toBeVisible();
});

test("creates, edits, persists, and deletes a browser-local event", async ({ page }) => {
  await page.getByRole("button", { name: /Add event/ }).click();
  await page.getByLabel(/Event name/).fill("Smoke Test Event");
  await page.getByLabel(/All Members/).check();
  await page.getByRole("button", { name: /Save event/ }).click();
  await page.reload();
  await page.getByRole("searchbox", { name: /Search events/ }).fill("Smoke Test Event");
  await page.getByRole("button", { name: /Smoke Test Event/ }).click();
  await page.getByRole("button", { name: /Edit Event/ }).click();
  await page.getByLabel(/Event name/).fill("Edited Smoke Event");
  await page.getByRole("button", { name: /Save event/ }).click();
  await page.getByRole("searchbox", { name: /Search events/ }).fill("Edited Smoke Event");
  await page.getByRole("button", { name: /Edited Smoke Event/ }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Delete/ }).click();
  await expect(page.getByText("Edited Smoke Event")).toHaveCount(0);
});

test("creates an event-linked EXCO planning task", async ({ page }) => {
  await page.getByLabel("Task").fill("Confirm smoke test logistics");
  await page.getByLabel("Linked event").selectOption("112");
  await page.getByLabel("Owner").fill("Tester");
  await page.getByRole("button", { name: /Add task/ }).click();
  await expect(page.getByText("Confirm smoke test logistics")).toBeVisible();
  await expect(page.getByText(/Marvell.*Owner: Tester/)).toBeVisible();
});

test("calendar remains usable at a mobile viewport", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile project only");
  await page.getByRole("button", { name: /Agenda/ }).click();
  await expect(page.getByRole("button", { name: /Marvell/ })).toBeVisible();
  await page.getByRole("button", { name: /Add event/ }).click();
  await expect(page.getByRole("dialog", { name: /Add event/ })).toBeVisible();
});
