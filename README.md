# NUSSCC-Digital-Hub

Unified web platform for NUS Semiconductor Club event planning and progress tracking, personal task management, and the Virtual Semiconductor Trek initiative.

## Local development

The Phase 1 application shell uses Next.js and TypeScript.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production builds use `npm run build`; Vercel detects the Next.js project from `package.json`.

Run the dependency-free Phase 1 structure and legacy-data safeguard check with `npm run verify:phase1`.

The two standalone HTML applications remain in the repository as migration references. Do not remove them until the preservation checklist is complete.

## Vercel deployment

The repository-level [`vercel.json`](vercel.json) selects the Next.js framework and `.next` build output. It intentionally overrides the project's previous `public` output-directory setting, which caused successful Next.js builds to end with a “No Output Directory named public” error.

In **Vercel → Project Settings → Build and Deployment**, the recommended dashboard configuration is:

- Framework Preset: **Next.js**
- Build Command: **Next.js default** (or `npm run build`)
- Output Directory: **Next.js default** (leave the override empty)

The committed configuration makes preview deployments deterministic, but clearing the old dashboard override avoids confusion for future maintainers.

The framework versions are pinned deliberately. Next.js `15.5.9` contains the complete fix identified in the [11 December 2025 security update](https://nextjs.org/blog/security-update-2025-12-11). Vercel blocks known-vulnerable releases, so dependency upgrades must retain patched Next.js, React, and React DOM versions and pass a production build before deployment.

## Project documentation

- [Phase 0 repository audit and migration plan](docs/phase-0-audit.md)
