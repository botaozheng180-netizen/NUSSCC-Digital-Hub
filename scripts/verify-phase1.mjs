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

const vercelConfig = JSON.parse(await readFile("vercel.json", "utf8"));
if (vercelConfig.framework !== "nextjs") {
  throw new Error("Vercel must use the Next.js framework preset.");
}
if (vercelConfig.outputDirectory !== ".next") {
  throw new Error(
    'Vercel output must override the legacy "public" setting with ".next".',
  );
}

const packageManifest = JSON.parse(await readFile("package.json", "utf8"));
if (packageManifest.dependencies?.next !== "15.5.9") {
  throw new Error(
    "Next.js must remain on the patched 15.5.9 release until an intentional upgrade is reviewed.",
  );
}
for (const dependency of ["react", "react-dom"]) {
  if (packageManifest.dependencies?.[dependency] !== "19.1.2") {
    throw new Error(`${dependency} must remain on the patched 19.1.2 release.`);
  }
}

const globalStyles = await readFile("app/globals.css", "utf8");
if (/align-items:\s*end\s*;/.test(globalStyles)) {
  throw new Error(
    'Use the broadly supported "flex-end" value instead of "end" for flex alignment.',
  );
}

console.log(
  "Phase 1 routes, patched dependencies, CSS compatibility, legacy-data safeguards, and Vercel output verified.",
);
