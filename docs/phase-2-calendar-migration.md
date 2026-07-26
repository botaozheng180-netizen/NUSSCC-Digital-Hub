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

During layout development, `/events` temporarily exposes the supplied calendar
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

| Identity | View internal calendar | Edit internal calendar |
| --- | --- | --- |
| Website visitor | No | No |
| Signed-in NUSSCC member | Yes | No |
| Eligible signed-in EXCO member | Yes | Yes |

Eligible editor roles are:

- President;
- Vice President;
- External Events Director;
- Internal Events Director;
- Content Creation & Publicity Director;
- Welfare & Fundraising Manager;
- Secretary.

The role list is represented in `lib/events/access-policy.ts` so UI states and
future server checks can use one vocabulary. Client-side checks may improve the
interface, but they must never be treated as security. The future server must
verify identity, active membership, and an eligible current role on every
calendar query and mutation.

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
