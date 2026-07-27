# Phase 3 database implementation handover

## Status and starting gate

The product specification is sufficiently complete to start Phase 3 design and
database scaffolding. It is **not** approval to expose the internal calendar or
enable production authentication yet. Provider selection, the final field-level
visibility matrix, and the exact delegation scopes remain explicit Phase 3
decisions and must be recorded before production data is loaded.

Phase 3 must preserve the Phase 2 local-storage adapter and legacy HTML until a
reviewed migration, reconciliation, backup, and rollback exercise has passed.

## Decisions carried forward

### Calendar and public events

- `/calendar` is an internal planning surface. Visitors cannot receive its data.
- An active incumbent member can view the calendar. Current EXCO can edit it.
- A delegated executive can receive either global edit access or access scoped
  to a semester or a particular event. The grantor, grantee, scope, start time,
  optional expiry, revocation time, and revoker must be recorded.
- EXCO planning tasks are visible either to all active verified members or only
  to the assigned team. This must be a per-task visibility choice with a safe
  default of `assigned_team`; every EXCO member can create and modify tasks.
- Completed events remain editable. Ordinary event fields do not require a
  second, more restrictive EXCO tier.
- Deleting an event requires an accessible confirmation dialog. Its planning
  tasks are deleted in the same database transaction. The audit history must
  retain evidence of the deletion.
- `/events` is unrestricted and is not a calendar. It contains a rotating hero
  or carousel of upcoming public-sign-up opportunities, followed by stacked
  past-event recaps.
- An internal calendar event never becomes public automatically. Eligible EXCO
  or a suitably delegated editor explicitly creates and publishes a public
  promotion after the Internal or External Events team has a web poster ready.
  A promotion may reference its source calendar event but has its own poster,
  copy, display order, publication window, and published state.

### Identity and profiles

- Every person has an individual account. A shared or committee-wide “internal
  password” is prohibited: it prevents reliable revocation and audit attribution.
- The maintained member/advisor roster is the allow-list for verification. It
  records verified names, emails, membership category, and appointments.
- NUS email is preferred. A personal email may be used only after an authorised
  administrator links and verifies it against the roster.
- Minimum profile fields are name, NUS department, and year of study. Hobbies
  and experience are optional. Roles are derived from verified appointments and
  are never self-selected profile fields.
- Accounts are retained across academic years. Alumni retain their account and
  history, but alumni status alone gives no internal-calendar access. A current
  Student Advisor appointment gives read-only calendar access. Club staff and
  other advisors need an explicit current appointment/access policy.
- Historical and current appointments appear on the profile as a timeline.
  Semiconductor Trek eligibility is a separate capability and may be granted to
  alumni, advisors, or current members per semester or academic year.

### Roles and handover

- Account categories include incumbent, alumni, Student Advisor, staff advisor,
  and visitor/unverified. These categories do not themselves imply every product
  permission; capabilities are calculated from active appointments and grants.
- EXCO appointments are: President, Vice President, Secretary, Welfare &
  Fundraising Manager, External Events Director, Internal Events Director, and
  Content Creation & Publicity Director. The data model supports two concurrent
  Vice Presidents and multiple Secretaries if required.
- Executives are ordinary verified members unless they receive a delegation.
- Only the active Presidential Cell (President and two Vice Presidents) can
  execute committee handover or manage the committee/team structure.
- Presidential Cell handover begins in early July. New appointments can be
  prepared in a pending state, but the new committee's operational rights become
  active on 1 August in `Asia/Singapore`.
- The new Presidential Cell retires and appoints the remaining committee.
  Outgoing EXCO appointments end; the person becomes an alumnus or receives a
  Student Advisor appointment. Only the latter retains read-only calendar access.
- Handover is an audited transaction with a preview, confirmation, and rollback
  plan. At least the acting President plus one Vice President should confirm it;
  the exact two-person approval workflow remains a Phase 3 decision.

## Provisional provider recommendation

Start the technical evaluation with a managed PostgreSQL platform that bundles
individual authentication, row-level authorization, object storage, and
database change subscriptions. Supabase is the provisional first candidate
because those capabilities map directly to this project and reduce the number
of services operated by a student committee. Compare it against a separate
managed-auth plus PostgreSQL design before accepting an architecture decision.

The provider decision must document:

1. Singapore/nearby data-region availability and applicable data handling;
2. free and paid limits for database size, monthly active users, storage,
   bandwidth, backups, and real-time connections;
3. account recovery, email delivery, optional MFA, and administrator recovery;
4. row-level policy and server-side authorization support;
5. exportability, point-in-time recovery, and vendor exit procedure; and
6. expected cost at one, three, and five years of retained member accounts.

The initial sign-in recommendation is an individual allow-listed email account
with provider-managed password hashing and reset, or an email one-time link.
Do not store plaintext passwords, invent a custom password system, or share a
single internal password. Require MFA at least for Presidential Cell and other
administrators before production handover operations are enabled.

## Proposed relational model

Names below are conceptual and can be adjusted in the database migration.

### Identity and organisation

- `profiles`: one row per provider identity; display/profile fields only.
- `verified_emails`: verified NUS or approved personal addresses and verification
  provenance.
- `academic_years`: stable ID, label, start/end dates, timezone, and lifecycle
  state. This replaces the current single constrained `AY2026/27` value and
  allows successive committees.
- `memberships`: person, academic year, membership category, active dates, and
  verification/audit fields.
- `committees`: academic year and handover lifecycle.
- `teams`: committee-scoped stable ID, code, display name, order, and active
  dates. Renaming a new-year team does not rewrite historical events.
- `appointments`: person, committee, optional team, position, start/end dates,
  and appointing actor. This produces the LinkedIn-style position history.
- `capability_grants`: grantee, capability, global/semester/event scope, grantor,
  active dates, expiry, and revocation metadata.
- `trek_entitlements`: person, semester or academic-year scope, grant source, and
  active dates; deliberately independent from calendar access.

### Calendar and planning

- `events`: academic year, public event fields, status, start/end values,
  timezone/all-day representation, and server metadata.
- `event_teams`: event-to-team assignments. The UI can continue presenting the
  current multi-select while the database maintains referential integrity.
- `planning_tasks`: event, task fields, visibility (`all_members` or
  `assigned_team`), completion metadata, and server metadata.
- `task_teams` and `task_assignees`: scoped responsibility without embedding
  mutable names in task records.
- `event_links` and `attachments`: related resources. Files live in private
  object storage rather than base64 database columns.
- `event_publications`: optional source event, poster, promotional copy, sign-up
  link, carousel order, publish/unpublish window, and publication state.
- `event_recaps`: optional source event, recap copy, media, occurrence date, and
  publication state for the stacked past-events section.
- `audit_entries`: append-only actor, action, entity, revision, timestamp, and a
  suitable before/after summary.

Event type and status remain choices in the editor, but the database must still
validate them. Use lookup tables or checked values so malformed direct requests
cannot introduce unsupported data. Managing teams reference committee-scoped
team IDs so Presidential Cell can update future names without corrupting
historical records.

### Required server-owned fields

Server metadata is not considered excessive. It is a small, necessary set of
columns for joint editing and accountability:

```text
id          globally stable identifier
revision    monotonic conflict-detection number
created_at  server timestamp
created_by  authenticated identity
updated_at  server timestamp
updated_by  authenticated identity
deleted_at  nullable server timestamp for recoverable deletion
deleted_by  nullable authenticated identity
```

Forms must never submit or control these fields. Updates and deletes provide an
expected revision; the server rejects stale writes instead of silently replacing
another EXCO member's changes.

## Date, deletion, and integrity rules

- Store the business timezone as `Asia/Singapore` and distinguish all-day events
  from timed events explicitly.
- End date/time cannot precede start date/time.
- Event type, status, referenced academic year, and referenced team must exist.
- Team display names can change only for the intended committee/year; historical
  event labels remain reproducible.
- Event deletion is initially a recoverable soft delete. Tasks are removed from
  active use in the same transaction and retained in audit/backup history.
- A destructive import is an authorised, audited server transaction with a
  pre-import snapshot, validation preview, explicit confirmation, and rollback.

## Authorization matrix to implement

| Principal/capability | Internal calendar | Tasks | Publish public event | Handover |
| --- | --- | --- | --- | --- |
| Visitor/unverified | No access | No access | No | No |
| Active incumbent | Read | Per task visibility | No | No |
| Active Student Advisor | Read | No by default | No | No |
| Alumni without appointment | No access | No access | No | No |
| Current EXCO | Read/write | Read/write | Yes | Presidential Cell only |
| Globally delegated executive | Read/write | As explicitly granted | If granted | No |
| Semester-delegated executive | Read/write in semester | As explicitly granted | If granted | No |
| Event-delegated executive | Read/write named event | Linked event if granted | Named event if granted | No |

Every read, mutation, export, import, file download, and real-time subscription
must be checked on the server. Client-side button visibility is not an
authorization boundary.

## Phase 3 implementation sequence

1. Record an architecture decision comparing provider, region, security,
   portability, and projected cost; then select the provider.
2. Add configuration and generated database types without connecting production
   member data.
3. Create identity/organisation migrations and seed only synthetic test data.
4. Create calendar, task, publication, attachment, grant, and audit migrations.
5. Implement server-side capability evaluation and database policies; prove
   visitor and cross-scope denial before building edit endpoints.
6. Convert `EventRepository` to an asynchronous contract and implement a server
   repository alongside the retained local adapter.
7. Add authenticated read-only `/calendar`; remove the temporary visitor preview
   before any internal production data is loaded.
8. Add revision-checked event/task mutations and audit entries.
9. Add publication/recap management and the public carousel/stacked presentation.
10. Run a reviewed master import in staging, reconcile counts and `.ics` output,
    test rollback, and obtain EXCO approval.
11. Add authorised real-time subscriptions, reconnect handling, and conflict UI.
12. Pilot with multiple EXCO accounts, test July/August handover, then schedule
    production migration and eventual legacy retirement.

## Open decisions that do not block scaffolding

- Choose the provider and sign-in mode after the architecture comparison.
- Confirm whether staff advisors have internal-calendar read access by default
  or only through an explicit appointment grant.
- Confirm the default task visibility. This document proposes `assigned_team`.
- Confirm whether event-scoped delegation automatically permits publishing that
  event or requires a separate `publish_public_event` capability.
- Confirm whether delegated semester access uses NUS Semester 1/2 only or also
  covers vacation/special-term calendar rows.
- Confirm the exact two-person approval rule and emergency recovery path for
  Presidential Cell handover.
- Define poster dimensions, carousel timing, reduced-motion behaviour, and public
  recap media limits before implementing the final `/events` presentation.

These items must be resolved before the affected feature reaches production,
but they do not prevent schema migrations, policy tests, or a synthetic-data
server repository from being started in the next conversation.

## First implementation increment (27 July 2026)

ADR-0001 provisionally selects Supabase-compatible PostgreSQL for local work. Ordered migrations now define the multi-year relational schema, forced deny-by-default RLS, scoped capability helpers, independent publication rights, optimistic revision functions, atomic event/task soft deletion, append-only client audit behavior, and synthetic fixtures. Realtime and production authentication remain disabled. See `phase-3-schema-and-authorization.md` for the implemented matrix and remaining trusted-server guarantees. The unresolved handover approval, staff-advisor, special-term, provider procurement, storage, and import decisions above remain unresolved.
