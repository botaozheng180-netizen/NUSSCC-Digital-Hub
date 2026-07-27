# ADR-0001: Phase 3 data and identity platform

**Status:** Accepted provisionally for local schema work (27 July 2026). Production approval is separate.

## Decision

Use **Supabase-compatible PostgreSQL** as the first implementation target. It combines managed PostgreSQL, provider-managed individual Auth, PostgreSQL row-level security (RLS), private object storage, database-change subscriptions, and CLI migrations. This increment uses only local migrations and synthetic identities. It does not create a production project, enable sign-in, or enable Realtime.

The reasonable alternative is **Clerk managed authentication plus Neon managed PostgreSQL**. It has a clearer service boundary and independent substitution of identity/database vendors, but requires the application to validate Clerk identity and propagate it safely into database authorization; storage and realtime also need separate designs. Supabase reduces integration and student-committee operations, while standard PostgreSQL and SQL migrations limit lock-in.

## Verified provider facts (official documentation)

The browsing service and direct network access returned HTTP 401/403 in this environment on 27 July 2026. The links below are the official pages selected for review; their time-sensitive quotas and prices **must be re-opened during production procurement rather than treated as verified numeric commitments in this offline ADR**.

- Supabase documents [Postgres databases](https://supabase.com/docs/guides/database/overview), [Auth](https://supabase.com/docs/guides/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), and [local CLI migrations](https://supabase.com/docs/guides/local-development/cli/getting-started).
- Region selection, including whether Singapore is available to the chosen plan at account-creation time, must be confirmed on the official [regions page](https://supabase.com/docs/guides/platform/regions).
- Backup retention and plan-dependent point-in-time recovery are described in [database backups](https://supabase.com/docs/guides/platform/backups) and [PITR](https://supabase.com/docs/guides/platform/point-in-time-recovery).
- Current MAU, database, storage, egress, Realtime, backup, and paid-plan amounts must be copied into the procurement record from [Supabase Pricing](https://supabase.com/pricing) on approval day.
- Neon documents its [AWS regions](https://neon.com/docs/introduction/regions), [branching and restore](https://neon.com/docs/introduction/branching), and current allowances on [Neon Pricing](https://neon.com/pricing). Clerk documents [authentication options](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options), [MFA](https://clerk.com/docs/guides/secure/multi-factor-authentication), and current allowances on [Clerk Pricing](https://clerk.com/pricing).

## Architectural inferences and trade-offs

- A colocated Singapore database is expected to reduce latency and simplify the organisation's regional preference; this is not itself a legal data-residency conclusion.
- One integrated provider is operationally safer for annual student handover than coordinating Auth, database, storage, realtime, and token claims across vendors.
- Supabase RLS keeps authorization adjacent to data and also applies to future Realtime reads, provided every table/channel is tested. Policy mistakes remain a serious risk, so RLS is forced and defaults to deny.
- Auth identities remain provider records; application tables contain only their UUIDs and verified roster links. No password column exists.
- The schema uses PostgreSQL types, constraints, functions, and ordinary SQL migrations. A logical dump plus object export and Auth identity export is the exit route. Auth password hashes may not be portable; plan for forced password reset or email-link sign-in after an identity-provider exit.

## Region and projected cost

No numeric cost is frozen because quotas and prices are time-sensitive and could not be retrieved from this runner. Before production, estimate years 1/3/5 using retained authenticated accounts, peak monthly active users, database growth, private poster/attachment bytes, egress, Realtime peak connections/messages, custom email volume, backup retention, PITR, and a Singapore-region compute plan. Record taxes and at least 30% growth headroom. Free tier is suitable only for disposable development if its pause, backup, and recovery guarantees meet that use; production should budget for a paid plan with an agreed recovery point objective.

## Recovery and exit

1. Keep migrations, seed shape, and authorization tests in Git.
2. Schedule encrypted `pg_dump` backups and private-storage object manifests/downloads outside the provider; verify restore into an empty staging project quarterly.
3. Before a destructive import/handover, retain a transaction snapshot and provider backup; reconcile counts and `.ics` output.
4. For provider exit, freeze writes, take a final consistent database dump, export private objects/checksums and permitted Auth identity metadata, restore PostgreSQL, remap storage URLs, configure a new managed identity provider, require account recovery where credentials cannot move, run authorization/reconciliation tests, then switch DNS/configuration.
5. Retain the old project read-only until acceptance and the agreed retention window, then securely delete it.

## External setup required before staging/production

- Create an organisation-owned provider account with at least two named administrators and recovery contacts.
- Confirm Singapore/nearby region, data-processing terms, billing alerts, quotas, backup retention/PITR, and support tier.
- Configure allow-listed email onboarding, NUS preference, administrator verification for personal emails, redirect URLs, custom SMTP/email delivery, and individual recovery.
- Require MFA for Presidential Cell/administrators before handover operations are enabled.
- Create private attachment buckets and review their RLS; provision server-only secrets in the deployment secret store, never browser code.
- Choose recovery objectives, backup custodian, incident process, and run a restore drill.
