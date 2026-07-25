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

## Project documentation

- [Phase 0 repository audit and migration plan](docs/phase-0-audit.md)
