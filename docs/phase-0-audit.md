# Phase 0 repository audit and migration plan

**Audit date:** 25 July 2026  
**Audited revision:** `ce6c7ee` (`work` branch)  
**Status:** Repository inspection complete; architecture recommendation requires approval before Phase 1

## 1. Executive summary

The repository currently contains two functional, browser-local applications, but it is not a deployable Digital Hub. There is no root `index.html`, package manifest, framework configuration, Vercel configuration, or build output. This explains why Vercel can mark the Git deployment as ready while the production domain returns `404: NOT_FOUND`: there is no application entry point for `/`.

The calendar and task board should be treated as source applications to preserve, not as the final site architecture. Both are standalone documents with embedded HTML, CSS, and JavaScript. The calendar is the source of shared event-shaped data, although its present persistence is local to one browser. The separate task board deliberately stores personal tasks locally and can import or cache calendar events.

Phase 1 should establish one deployable application shell first, with shared navigation and placeholder routes. Existing features should then be migrated incrementally behind stable data adapters rather than rewritten all at once.

## 2. Audit scope and method

This audit covered:

- repository structure and Git state;
- application entry points and deployment configuration;
- user-facing calendar and task-board capabilities;
- browser storage keys and record shapes;
- import, export, backup, and cross-application integration;
- authentication, authorization, privacy, and maintainability risks;
- a proposed target structure and phased migration approach.

This audit did **not** modify either standalone application, access the Vercel project settings, inspect a separate deployed-calendar repository, or test with production member data. No credentials or production data were present in the repository.

## 3. Current repository inventory

| File | Approximate size | Purpose |
| --- | ---: | --- |
| `NUSSCC Event Calendar (AY2627).html` | 176 KB / 2,820 lines | Standalone AY26/27 event calendar and EXCO task list |
| `Task Board.html` | 84 KB / 1,120 lines | Standalone private personal task board |
| `README.md` | minimal | Repository identity and description |

No `index.html`, `package.json`, lockfile, `vercel.json`, framework configuration, automated tests, CI workflow, environment example, or source-module directory exists.

## 4. Current deployment finding

The Vercel screenshot supplied for this audit shows:

- the Git repository is connected;
- `main` is the production branch;
- commit `ce6c7ee` produced a deployment reported as ready;
- the production domain is `nusscc-digital-hub.vercel.app`;
- visiting the deployment returns `404: NOT_FOUND`.

The repository itself contains no Vercel configuration or deployable root entry. A successful deployment therefore has no page to serve at `/`. Phase 1 must add a recognized application entry and repeatable build.

The following Vercel settings remain unverified because they live outside this repository:

1. project root directory;
2. framework preset;
3. install, build, and output settings;
4. Node.js version;
5. environment variables;
6. preview-deployment behavior;
7. deployment protection and team access;
8. ownership and transfer arrangements;
9. whether another repository or project backs the previously deployed calendar;
10. production and preview usage levels.

Before merging Phase 1, the project owner should capture these settings in the repository documentation without copying secret values.

## 5. Event Calendar audit

### 5.1 Current capabilities

The calendar implements substantial behavior that must be preserved or intentionally retired:

- Semester 1 and Semester 2 views based on NUS academic weeks;
- calendar-grid and agenda views;
- event creation, editing, deletion, and multi-day events;
- event types, multiple managing-team categories, and planning statuses;
- time, all-day, venue, expected attendance, budget, and description fields;
- event resource links and compressed image attachments;
- search and filters;
- event-linked EXCO to-do items;
- Google Calendar links and bulk `.ics` export;
- JSON backup and restore for events and EXCO tasks;
- a generated read-only HTML snapshot;
- print/PDF modes, including a semester poster;
- local edit/backup status reporting.

### 5.2 Persistence

The calendar uses these browser `localStorage` keys:

| Key | Contents |
| --- | --- |
| `nus_semicon_events_ay2627` | event array |
| `nus_semicon_todos_ay2627` | EXCO/event-planning task array |
| `nus_semicon_last_edit_ay2627` | last local edit timestamp |
| `nus_semicon_last_backup_ay2627` | last backup timestamp |

There is no network request, shared database, user identity, or server-side permission check in the audited file. Consequently, separate browsers hold separate calendars unless data is manually exported and restored. The file is not an authoritative online multi-user calendar in its current form.

### 5.3 Event record shape

The current code is schemaless JavaScript. A representative event created by the UI contains:

```text
id                 number generated from the browser-local array
name               string
cats               array of managing-team keys
type               event type key
weekId             NUS academic-week key
day                weekday key
endWeekId           optional academic-week key
endDay              optional weekday key
startTime           optional HH:mm
endTime             optional HH:mm
allDay              boolean
venue               string
desc                string
expected            number or null
budget              number or null
status              planning-status key
links               array of { label, url }
images              array of { name, src } base64 data URLs
```

Legacy compatibility code also accepts older single-category and date/week representations. Phase 1 must not silently invalidate existing JSON backups.

### 5.4 Event categories and statuses

Managing-team keys are currently:

```text
presidential, finance, hr, publicity, internal, external, allmembers
```

The event planning pipeline includes potential, outreach sent, in discussion, confirmed, completed, and declined/cancelled states. Public visibility is not currently separated from internal planning visibility; it is only a frontend mode or generated snapshot.

### 5.5 Calendar risks

- Browser-local numeric IDs can collide when independent calendars are merged.
- Shared and internal fields coexist in the same object.
- Any user with the editable HTML can perform all apparent EXCO actions.
- Images stored as base64 consume limited browser storage quickly and inflate backups.
- Several user-controlled values are interpolated into HTML strings; this requires a security review before accepting untrusted or shared data.
- Empty defaults mean a new browser sees no events.
- AY26/27 dates and storage keys are embedded throughout the file, limiting reuse.
- The 2,820-line single document makes isolated testing and ownership transfer difficult.

## 6. Personal Task Board audit

### 6.1 Current capabilities

The separate task board provides:

- private general and event-linked tasks;
- open, completed, and all views;
- team and priority filters;
- due dates and overdue presentation;
- editable task descriptions/details;
- nested checklists;
- drag-and-drop ordering within a task group;
- one resource link and one compressed image attachment per task;
- event grouping with cached event names;
- browser-calendar synchronization;
- `.ics` and JSON event import;
- task JSON backup and restore;
- print-friendly expanded checklists;
- browser-local persistence.

### 6.2 Persistence and event sources

| Key | Contents |
| --- | --- |
| `nusscc_my_tasks_private_v1` | private personal task array |
| `nusscc_my_tasks_events_cache_v1` | last imported/synchronized event subset |
| `nus_semicon_events_ay2627` | read-only input from the calendar when both pages share an origin |

The task board supports three event-input mechanisms:

1. read the calendar key from the same browser and origin;
2. import calendar-generated `.ics` data;
3. paste a raw event JSON array.

The first mechanism only works when both tools are served from the same origin. A `file://` workflow or different deployment domains can have isolated storage behavior. The cached subset intentionally keeps event labels available between imports.

### 6.3 Personal task record shape

A representative personal task contains:

```text
id                 browser-local number
text               string
done               boolean
eventId             event identifier or null
eventName           cached event label or null
priority            priority key
due                 YYYY-MM-DD or null
team                managing-team key or null
link                { label, url } or null
checklist           array of checklist items
order               number within its event/general group
created             YYYY-MM-DD
image               optional compressed base64 object
```

### 6.4 Task-board risks

- Tasks do not follow a member to another device.
- Clearing browser storage removes tasks unless the user has a backup.
- Numeric task and event identifiers are not globally stable.
- Event snapshots can become stale or orphaned after calendar changes.
- Duplicate academic-week/category mappings exist in both HTML files and can drift.
- Imported JSON is shape-checked only minimally.
- Base64 images are constrained by browser storage.
- Local tasks are appropriately private today; moving them online prematurely would introduce unnecessary privacy and authorization work.

## 7. Current integration model

The applications are loosely coupled through browser storage and exported files:

```text
Event Calendar
  ├─ localStorage event array ───────────────┐
  ├─ exported .ics ──────────────────────┐   │
  └─ exported JSON backup ────────────┐  │   │
                                      ▼  ▼   ▼
                              Personal Task Board
                              ├─ cached event subset
                              └─ private local tasks
```

This is useful as a prototype, but it does not provide a shared source of truth. It also conflates the calendar's internal EXCO to-do list with the separate member's private task board. These must remain distinct concepts in the target architecture.

## 8. Privacy and authorization assessment

### Appropriate to remain local initially

- personal tasks;
- personal checklists and ordering;
- task attachments and notes;
- nonessential UI preferences.

### Must eventually be centralized

- member accounts and roles;
- published events;
- internal EXCO planning data, protected by authorization;
- verified attendance;
- event-to-roadmap relationships;
- personal Trek progress derived from verified attendance;
- achievement definitions and awards;
- important administrative audit records.

No current code implements authentication or authorization. Hiding a button or using a read-only frontend snapshot is not an authorization boundary. Until server-side roles exist, the deployed Phase 1 shell must not claim to protect EXCO or member-only information.

## 9. Architecture options

### Option A: static multi-page HTML

Add `index.html`, rename/link the existing files, and create static placeholders.

**Advantages:** fastest deployment and smallest initial learning curve.  
**Risks:** preserves duplicated code, makes shared navigation harder, and defers nearly all integration work.

This is acceptable only as a temporary demonstration, not as the recommended Digital Hub foundation.

### Option B: Vite application with client-side routing

Use a small React and TypeScript frontend built to static assets.

**Advantages:** straightforward frontend development, shared components, simple Vercel output.  
**Risks:** authentication and protected backend operations require a separate service or Vercel functions; client-side route rewrites must be configured.

### Option C: Next.js application on Vercel

Use Next.js with TypeScript and the App Router, initially rendering mostly static/client-side pages. Add server-side routes only when accounts and shared data arrive.

**Advantages:** file-based routing, shared layouts, first-class Vercel deployment, and a path to server-enforced authentication and APIs without replacing the frontend foundation.  
**Risks:** more concepts than static HTML, framework lock-in, and a temptation to introduce backend complexity too early.

### Recommendation

Adopt **Option C**, subject to owner approval, with strict scope control:

- Phase 1 creates only the shell, routes, design tokens, and storage adapters.
- Calendar and task logic are migrated incrementally, not rewritten together.
- No database or authentication is introduced in Phase 1.
- Personal tasks remain local by default.
- Framework-generated code is kept small and documented for future committees.

This recommendation fits the known long-term need for server-side roles, attendance verification, and member progress while avoiding a second frontend migration later. If the owner prioritizes the smallest possible learning surface over that future path, Option B is the fallback.

## 10. Proposed Phase 1 route map

| Route | Initial visibility | Phase 1 content |
| --- | --- | --- |
| `/` | public | dashboard shell and project introduction |
| `/events` | public-safe content only | calendar migration entry point |
| `/tasks` | local user | private local task-board migration entry point |
| `/trek` | public overview | static Semiconductor Trek overview |
| `/achievements` | public overview | static title/criteria preview |
| `/profile` | future member-only | honest account-not-available state |
| `/settings` | local user | local preferences and data controls placeholder |
| `/admin` | future EXCO-only | not exposed until server authorization exists |

The navigation should not show a leaderboard initially. Its motivation and privacy effects should be evaluated with members before implementation.

## 11. Proposed source structure

```text
app/
  layout.tsx
  page.tsx
  events/page.tsx
  tasks/page.tsx
  trek/page.tsx
  achievements/page.tsx
  profile/page.tsx
  settings/page.tsx
components/
  layout/
  ui/
  events/
  tasks/
lib/
  events/
    model.ts
    calendar.ts
    local-storage.ts
    import-export.ts
  tasks/
    model.ts
    local-storage.ts
  trek/
    model.ts
public/
docs/
```

Event and task concerns should remain separate. Shared academic-calendar mappings, team definitions, data validation, and identifiers should have one canonical module rather than being copied between pages.

## 12. Proposed stable data boundaries

Before UI migration, define and test:

1. a versioned `Event` type;
2. a versioned `PersonalTask` type;
3. converters for legacy browser records and backups;
4. validators at import boundaries;
5. globally stable IDs for new records, while preserving legacy numeric IDs through migration;
6. a public event projection that excludes budget, internal notes, planning tasks, and other EXCO-only fields;
7. an event source interface so local storage can later be replaced by an API without rewriting every page;
8. a personal task repository interface whose initial implementation remains local.

Legacy storage keys should not be renamed in the first release unless a tested one-time migration and rollback path are provided.

## 13. Phase 1 preservation checklist

Before the old standalone files can be retired, confirm that the migrated application preserves:

- [ ] existing local event and EXCO-task data;
- [ ] existing private personal tasks;
- [ ] calendar semester/date calculations;
- [ ] event types, teams, and statuses;
- [ ] search, filter, calendar, and agenda behavior;
- [ ] add/edit/delete and multi-day behavior;
- [ ] backup and restore compatibility;
- [ ] `.ics` and Google Calendar output;
- [ ] event-linked personal tasks;
- [ ] task checklists, filters, grouping, and ordering;
- [ ] print behavior where it remains operationally required;
- [ ] responsive use on mobile and desktop;
- [ ] explicit empty, loading, validation, and storage-error states.

The two original HTML files should remain available as migration references until this checklist passes.

## 14. Verification strategy

Phase 1 should introduce:

- formatting, linting, and type checking;
- unit tests for date calculations, legacy conversion, validation, and import/export;
- component tests for critical forms and local persistence;
- a production build check on every pull request;
- browser smoke tests for navigation, event persistence, task persistence, and mobile layout;
- preview-deployment review before merging to `main`;
- manual backup/restore compatibility checks using non-sensitive sample data.

Production member data must not be used in automated fixtures or committed to Git.

## 15. Open decisions requiring the project owner

These decisions should be made before the relevant phase, not all before Phase 1:

### Required before Phase 1

1. Approve Next.js/TypeScript or choose the Vite fallback.
2. Confirm that this repository is the authoritative codebase.
3. Identify whether the newer online calendar has code or data in another repository.
4. Confirm which calendar capabilities are essential versus legacy convenience features.
5. Confirm whether the first shell may be publicly accessible with clearly labelled placeholders.

### Required before shared calendar storage

6. Identify who owns the Vercel project and future handover procedure.
7. Choose the shared data provider after comparing cost, authorization, backup, and portability.
8. Define public event fields separately from EXCO-only fields.
9. Define the canonical event status and category vocabularies.

### Required before member accounts

10. Define how current NUSSCC membership is verified.
11. Define member, EXCO, and administrator role assignment/removal.
12. Define account recovery and committee handover.
13. Decide the minimum member data retained and its correction/deletion process.

### Required before Trek progress

14. Define eligible events and attendance verification.
15. Approve roadmap nodes and event-to-node rules.
16. Approve achievement criteria and correction/revocation rules.
17. Decide whether any aggregate or ranked view is appropriate and opt-in.

## 16. Phase 0 exit criteria

- [x] Repository structure inspected.
- [x] Current framework and deployment entry point identified: none.
- [x] Existing local persistence documented.
- [x] Calendar and task-board responsibilities distinguished.
- [x] Current integration paths documented.
- [x] Major privacy, authorization, migration, and maintainability risks recorded.
- [x] Architecture options and recommendation presented.
- [x] Proposed routes, modules, preservation checks, and verification strategy documented.
- [ ] External Vercel settings confirmed by the project owner.
- [ ] Separate deployed-calendar source, backend, and ownership confirmed, if they exist.
- [ ] Phase 1 architecture recommendation approved.

Phase 0 repository analysis is complete. The unchecked external and owner decisions are explicit inputs to later work, not reasons to rewrite the existing applications speculatively.
