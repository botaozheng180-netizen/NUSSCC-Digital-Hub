import { describe, expect, it } from "vitest";
import { AY2627_PREVIEW_EVENTS } from "@/lib/events/ay2627-preview-data";
import { InMemoryAsyncEventRepository, RepositoryError, mapDatabaseEvent } from "@/lib/events/async-event-repository";
import { LocalStorageEventRepository } from "@/lib/events/event-repository";

const input = { public: AY2627_PREVIEW_EVENTS[0].public, planning: AY2627_PREVIEW_EVENTS[0].planning };
const rejects = async (promise: Promise<unknown>, code: string) => expect(promise).rejects.toMatchObject({ code });

describe("async event repository boundary", () => {
  it("lists, creates, updates, revision-checks and soft deletes", async () => {
    let tick = 0; const repo = new InMemoryAsyncEventRepository("synthetic-actor", true, () => `2026-07-27T00:00:0${tick++}Z`);
    const created = await repo.create(input, "synthetic-year");
    expect(created).toMatchObject({ revision: 1, createdBy: "synthetic-actor", deletedAt: null });
    expect(await repo.list({ academicYearId: "synthetic-year" })).toHaveLength(1);
    const updated = await repo.update(created.id, { ...input, public: { ...input.public, name: "Updated" } }, 1);
    expect(updated).toMatchObject({ revision: 2, public: { name: "Updated" } });
    await rejects(repo.update(created.id, input, 1), "revision_conflict");
    await repo.delete(created.id, 2);
    expect(await repo.list({ academicYearId: "synthetic-year" })).toHaveLength(0);
    expect(await repo.list({ academicYearId: "synthetic-year", includeDeleted: true })).toMatchObject([{ revision: 3, deletedBy: "synthetic-actor" }]);
    await rejects(repo.update(created.id, input, 3), "not_found");
  });
  it("returns typed authentication and authorization failures", async () => {
    await rejects(new InMemoryAsyncEventRepository(null).list({ academicYearId: "x" }), "unauthenticated");
    await rejects(new InMemoryAsyncEventRepository("member", false).create(input, "x"), "forbidden");
    expect(new RepositoryError("unavailable", "offline")).toMatchObject({ name: "RepositoryError", code: "unavailable" });
  });
  it("maps database records without accepting metadata from editable input", () => {
    expect(mapDatabaseEvent({ id: "event", legacy_id: 7, academic_year_label: "AY2026/27", revision: 4, created_at: "a", created_by: "one", updated_at: "b", updated_by: "two", deleted_at: null, deleted_by: null, payload: input })).toMatchObject({ id: "event", legacyId: 7, revision: 4, createdBy: "one", public: input.public });
  });
  it("leaves the synchronous local-storage adapter behavior intact", () => {
    const local = new LocalStorageEventRepository(window.localStorage, { fallbackEvents: AY2627_PREVIEW_EVENTS, createId: () => "same" });
    local.create(input); expect(local.list()).toHaveLength(16); expect(window.localStorage.getItem("nus_semicon_events_ay2627")).toContain("local-ay2627-same");
  });
});
