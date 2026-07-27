# Phase 3 schema, authorization, and local operation

## Data dictionary

`profiles` links one provider identity to non-secret profile data; `verified_emails` is the administrator-verified allow-list. `academic_years` owns label, date range, Singapore timezone, semesters, and lifecycle. `memberships`, `committees`, committee-scoped `teams`, and dated `appointments` preserve history. `capability_grants` records independent global/semester/event grants and revocation; `trek_entitlements` is deliberately independent.

`events` distinguishes all-day dates from timed instants and carries revision/audit/soft-delete metadata. `event_team_assignments`, `event_links`, and `attachment_metadata` use foreign keys. `planning_tasks` defaults to `assigned_team`; its team and person relations are normalized. `public_event_publications` and `public_event_recaps` are explicit, independently authored projections: event confirmation never publishes. `audit_entries` is append-only to clients. `import_runs` records an idempotency digest, pre-import snapshot, rejects, reconciliation, confirmation, and rollback state.

The database owns IDs, revisions, actors, and timestamps. Clients pass editable fields and an expected revision only. `soft_delete_event_checked` locks and revision-checks the event, soft-deletes it and active tasks, and audits in one transaction. The exact import executor is intentionally deferred until staging authentication and reviewed legacy mapping exist.

## Policy matrix

| Principal | Calendar read | Calendar write | Tasks | Drafts/publish | Audit |
|---|---:|---:|---|---|---:|
| Visitor / unverified identity | No | No | No | Published public rows only | No |
| Active verified incumbent | Yes | No | `all_members` or assigned active team | No | No |
| Current EXCO appointment | Yes | Yes | Read/write | Prepare/publish | No direct mutation |
| Student Advisor appointment | Yes | No | No by default | No | No |
| Alumni / staff advisor without qualifying appointment | No | No | No | No | No |
| Active calendar grant | Via qualifying membership | Global, matching semester, or named event | Separate rule | No | No |
| Active publication grant | No implied calendar right | No implied calendar right | No | Independent prepare/publish capability | No |

Expired/revoked grants fail. RLS is enabled and forced on every application table; absence of a policy is deny-by-default. Security-definer helpers have fixed search paths and no direct client execution. Published promotions/recaps alone have anonymous SELECT policies. Attachment metadata follows its event/task access; actual private Storage bucket policies still require staging tests. Trusted server transactions are required for imports, handover approval/recovery, identity administration, attachment object operations, and exact publication-state transition validation.

## Local setup and migrations

Prerequisites are Docker and the Supabase CLI. No remote account is required.

```sh
npx supabase@latest start
npx supabase@latest db reset       # empty DB -> ordered migrations -> synthetic seed
npx supabase@latest test db        # SQL assertions when added to the local CLI runner
npx supabase@latest db lint
```

Realtime is deliberately disabled. `.env.example` contains placeholders; the anon key is public only after review, while the service-role key and direct database URL are server-only. Never commit `.env` files or put service-role values in `NEXT_PUBLIC_*` variables.

## Unresolved production decisions

- Exact two-person Presidential Cell handover approval and emergency recovery workflow.
- Staff-advisor default remains **no access** unless a qualifying appointment/grant is approved.
- Semester delegation handling for vacation/special terms.
- Field-level profile visibility, attachment retention/size/types, and Storage object policies.
- Provider region/account, numeric pricing, RPO/RTO, backup custodian, SMTP, account recovery, and MFA enforcement configuration.
- Import mapping/rejection thresholds, reviewed master-calendar approval, and rollback acceptance criteria.
- Realtime remains off until authenticated subscription policies and reconnect/conflict tests pass.
