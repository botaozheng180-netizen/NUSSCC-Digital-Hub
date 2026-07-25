import { access, readFile } from "node:fs/promises";

const requiredRoutes = [
  "app/page.tsx",
  "app/events/page.tsx",
  "app/tasks/page.tsx",
  "app/trek/page.tsx",
  "app/achievements/page.tsx",
  "app/profile/page.tsx",
  "app/settings/page.tsx",
];

const preservedLegacyFiles = [
  "NUSSCC Event Calendar (AY2627).html",
  "Task Board.html",
];

await Promise.all(
  [...requiredRoutes, ...preservedLegacyFiles].map((path) => access(path)),
);

const taskPage = await readFile("app/tasks/page.tsx", "utf8");
if (!taskPage.includes('const KEY = "nusscc_my_tasks_private_v1"')) {
  throw new Error("The Phase 1 task route must retain the legacy storage key.");
}
if (taskPage.includes("localStorage.setItem")) {
  throw new Error("The Phase 1 task route must not write legacy task data.");
}

const shell = await readFile("components/app-shell.tsx", "utf8");
for (const route of [
  "/events",
  "/tasks",
  "/trek",
  "/achievements",
  "/profile",
  "/settings",
]) {
  if (!shell.includes(`"${route}"`)) {
    throw new Error(`Shared navigation is missing ${route}.`);
  }
}

console.log("Phase 1 routes, navigation, and legacy-data safeguards verified.");
