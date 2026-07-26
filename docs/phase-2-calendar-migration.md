# Phase 2 calendar migration

## Product target

The Digital Hub calendar is intended to become a live, shared calendar: an
authorised edit is saved to the central source of truth and becomes visible to
other signed-in users without exchanging browser backups. The existing live
calendar at `https://nussc-events-cal.vercel.app/` is a product reference for
that experience, not a data source or a dependency of this migration.

The migration remains incremental. Phase 2 begins with a typed model, academic
calendar utilities, compatibility conversion, and a read-only local adapter.
Authentication, a database, and real-time subscriptions must not be improvised
inside the local-storage migration. They will be introduced together after the
legacy compatibility path is tested.

## Intended access policy

During layout development, `/calendar` temporarily exposes the supplied calendar
snapshot without requiring sign-in. The preview omits EXCO tasks, budgets,
attendance, images, and contact details. This is a deliberate design-review
exception, not the final access policy; it must be removed when authenticated
calendar reads are introduced.

The preview's JSON export/import controls currently operate only on the legacy
browser-local keys. Import validates the file and requires an explicit
"Proceed anyway" confirmation because it replaces the current local event
array. In the shared-calendar phase, the same operation must be restricted to
eligible EXCO roles and performed as an audited server transaction with a
recoverable pre-import snapshot; a browser write must never be treated as a
live shared-calendar import.

Local export parity now includes versioned JSON backups and bulk `.ics` files.
Restore checks the backup version and academic year, rejects duplicate IDs,
previews added/retained/removed IDs, offers a pre-import download, and verifies
the replacement write. If verification fails, the previous browser data is
restored. These safeguards are the minimum contract for the later audited
server import; they do not make the current browser operation collaborative.

The event editor is likewise a temporary browser-local implementation. It
supports layout and CRUD compatibility testing, but it does not grant an EXCO
role and does not update other browsers. Before shared editing launches, these
mutations must move behind authenticated server actions that enforce the
calendar editor-role policy and record revision/audit metadata.

Calendar components now submit `NewCalendarEvent`/`CalendarEventUpdate` input
data without creating persistence metadata. All event list, CRUD, replacement,
and backup operations cross the `EventRepository` interface. The current
`LocalStorageEventRepository` owns legacy serialization and timestamps; a
future server repository can implement the same contract while adding stable
IDs, revisions, and authenticated audit fields.

| Identity | View internal calendar | Edit internal calendar |
| --- | --- | --- |
| Website visitor | No | No |
| Signed-in NUSSCC member | Yes | Only when specifically delegated |
| Signed-in EXCO member | Yes | Yes |

All current EXCO members can edit. An EXCO-authorised member may also receive an
explicit calendar-editor delegation without becoming EXCO. That delegation must
be granted and revoked through an auditable administrative process; it must not
be inferred from a hidden button or other client state. Client-side checks may
improve the interface, but the future server must verify identity, active
membership, current EXCO status or an active delegation on every query and
mutation.

The unrestricted `/events` route is separate from the internal calendar. It is
reserved for public recaps of past events and advertisements for selected
upcoming events. Publishing an item there must be an explicit projection or
editorial action; internal calendar records must never become public merely
because their planning status changes.

## Migration stages

1. **Compatibility foundation (current):** canonical types, AY26/27 date
   calculations, legacy normalization, fixtures, and tests. The legacy HTML and
   all four existing local-storage keys remain unchanged.
2. **Local read-only calendar:** render normalized browser-local events inside
   `/events`; no writes and no claims of shared state.
3. **Local feature parity:** migrate filters, agenda/grid views, export, guarded
   restore, and finally editing while preserving legacy backup compatibility.
4. **Identity and server design:** select the identity and data providers,
   define membership/role lifecycle and committee handover, and threat-model
   every read and write. Visitors must receive no internal calendar records.
5. **Shared-data transition:** import a reviewed master backup into a versioned
   central store, run local and server sources in a reconciliation period, and
   retain downloadable rollback backups.
6. **Live synchronisation:** subscribe authenticated clients to authorised
   event changes, use server-generated stable IDs and revision metadata, and
   resolve concurrent edits without silently overwriting newer data.
7. **Legacy retirement:** retire the standalone editor only after parity,
   access-control, backup/restore, synchronisation, and rollback checks pass.

## Future shared-event requirements

The central event record will extend the canonical model with server-managed
metadata rather than replacing legacy-compatible event fields:

```text
id                 globally stable server ID
revision           monotonic version used for conflict detection
createdAt          server timestamp
createdBy          authenticated member ID
updatedAt          server timestamp
updatedBy          authenticated member ID
```

Writes must use optimistic concurrency (for example, an expected `revision`) so
two EXCO editors cannot unknowingly overwrite one another. Audit metadata must
be written by the server, never accepted from the browser. Attachments should
eventually move out of base64 event records into access-controlled object
storage, but legacy base64 images must remain importable during migration.

## Calendar test gates

The migration now has three automated layers:

- `npm run test:unit` covers academic dates, normalization, JSON/ICS
  compatibility, repository CRUD, and planning-task persistence;
- `npm run test:component` covers the event editor, planning-task form, search,
  agenda switching, and event details using a simulated browser DOM;
- `npm run test:smoke` runs the public-events/internal-calendar split and core
  calendar workflows in desktop and mobile Chromium.

Run `npm test`, `npm run test:smoke`, `npm run typecheck`, and `npm run build`
before merging calendar changes. Production member data must not be introduced
into fixtures; the reviewed 26 July preview remains the deterministic dataset.
