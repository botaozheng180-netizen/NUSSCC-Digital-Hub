import type { CalendarEvent, CalendarEventInput, PersistedCalendarEvent } from "./model";

export type RepositoryErrorCode = "unauthenticated" | "forbidden" | "validation" | "not_found" | "revision_conflict" | "rate_limited" | "unavailable";

export class RepositoryError extends Error {
  constructor(readonly code: RepositoryErrorCode, message: string, readonly cause?: unknown) {
    super(message); this.name = "RepositoryError";
  }
}

export type AsyncEventQuery = { academicYearId: string; includeDeleted?: boolean };

/** Server-compatible boundary. Implementations, not callers, own identity and audit metadata. */
export interface AsyncEventRepository {
  list(query: AsyncEventQuery): Promise<PersistedCalendarEvent[]>;
  create(input: CalendarEventInput, academicYearId: string): Promise<PersistedCalendarEvent>;
  update(id: string, input: CalendarEventInput, expectedRevision: number): Promise<PersistedCalendarEvent>;
  delete(id: string, expectedRevision: number): Promise<void>;
}

export type DatabaseEventRecord = {
  id: string; legacy_id: string | number | null; academic_year_label: string;
  revision: number; created_at: string; created_by: string; updated_at: string; updated_by: string;
  deleted_at: string | null; deleted_by: string | null; payload: CalendarEventInput;
};

export function mapDatabaseEvent(record: DatabaseEventRecord): PersistedCalendarEvent {
  return {
    schemaVersion: 1, id: record.id, legacyId: record.legacy_id,
    academicYear: record.academic_year_label as CalendarEvent["academicYear"],
    ...record.payload, revision: record.revision, createdAt: record.created_at,
    createdBy: record.created_by, updatedAt: record.updated_at, updatedBy: record.updated_by,
    deletedAt: record.deleted_at, deletedBy: record.deleted_by,
  };
}

/** Synthetic reference implementation used to prove repository semantics without credentials. */
export class InMemoryAsyncEventRepository implements AsyncEventRepository {
  private records = new Map<string, PersistedCalendarEvent>();
  constructor(private readonly actor: string | null, private readonly canWrite = true, private readonly now = () => new Date().toISOString()) {}
  async list({ includeDeleted = false }: AsyncEventQuery) { this.authorize(false); return [...this.records.values()].filter((e) => includeDeleted || !e.deletedAt); }
  async create(input: CalendarEventInput, _academicYearId: string) {
    this.authorize(true); const at = this.now(); const id = crypto.randomUUID();
    const value: PersistedCalendarEvent = { schemaVersion: 1, id, legacyId: null, academicYear: "AY2026/27", ...structuredClone(input), revision: 1, createdAt: at, createdBy: this.actor!, updatedAt: at, updatedBy: this.actor!, deletedAt: null, deletedBy: null };
    this.records.set(id, value); return structuredClone(value);
  }
  async update(id: string, input: CalendarEventInput, expectedRevision: number) {
    this.authorize(true); const old = this.required(id); this.expectRevision(old, expectedRevision);
    const value = { ...old, ...structuredClone(input), revision: old.revision + 1, updatedAt: this.now(), updatedBy: this.actor! };
    this.records.set(id, value); return structuredClone(value);
  }
  async delete(id: string, expectedRevision: number) {
    this.authorize(true); const old = this.required(id); this.expectRevision(old, expectedRevision);
    this.records.set(id, { ...old, revision: old.revision + 1, deletedAt: this.now(), deletedBy: this.actor!, updatedAt: this.now(), updatedBy: this.actor! });
  }
  private authorize(write: boolean) { if (!this.actor) throw new RepositoryError("unauthenticated", "Sign in is required."); if (write && !this.canWrite) throw new RepositoryError("forbidden", "Calendar editing is not permitted."); }
  private required(id: string) { const value = this.records.get(id); if (!value || value.deletedAt) throw new RepositoryError("not_found", "Event not found."); return value; }
  private expectRevision(value: PersistedCalendarEvent, expected: number) { if (value.revision !== expected) throw new RepositoryError("revision_conflict", "The event was changed by another editor."); }
}
