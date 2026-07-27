import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = new URL("../../supabase/migrations/", import.meta.url);
const files = readdirSync(dir).sort();
const sql = files.map((file) => readFileSync(new URL(file, dir), "utf8")).join("\n");

describe("Phase 3 database foundation", () => {
  it("has uniquely ordered, repeatable migration inputs and a synthetic seed", () => {
    expect(files).toEqual(["202607270001_phase3_foundation.sql", "202607270002_authorization_and_transactions.sql"]);
    expect(new Set(files.map((name) => name.slice(0, 14))).size).toBe(files.length);
    const seed = readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
    expect(seed).toContain("example.test"); expect(seed).not.toMatch(/@nus\.edu\.sg/i);
  });
  it("declares relational integrity and date/scope constraints", () => {
    expect(sql).toMatch(/references academic_years/g); expect(sql).toMatch(/references teams/g);
    expect(sql).toContain("ends_at>=starts_at"); expect(sql).toContain("ends_at>=starts_at".replace("ends_at", "expires_at"));
    expect(sql).toContain("scope='semester' and academic_year_id is not null and semester is not null");
    expect(sql).toContain("not all_day and starts_on is null"); expect(sql).toContain("timezone='Asia/Singapore'");
  });
  it("forces RLS, defaults sensitive tables to deny, and scopes authorization", () => {
    expect(sql).toContain("force row level security"); expect(sql).toContain("private.is_verified(person)");
    expect(sql).toContain("private.is_current_member(person) or private.has_active_appointment(array['student_advisor']");
    expect(sql).toContain("g.revoked_at is null"); expect(sql).toContain("g.scope='event' and g.event_id=target_event");
    expect(sql).toContain("promotion_publish"); expect(sql).toContain("No client policies exist for audit_entries/import_runs");
    expect(sql).not.toMatch(/create policy .*audit_entries/i);
  });
  it("requires optimistic revisions and transactional task cleanup", () => {
    expect(sql).toContain("revision=expected_revision"); expect(sql).toContain("raise exception 'revision conflict'");
    expect(sql).toContain("update planning_tasks set deleted_at=statement_timestamp()"); expect(sql).toContain("insert into audit_entries");
  });
});
