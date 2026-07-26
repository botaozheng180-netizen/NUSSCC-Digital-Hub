import { createCalendarBackup, toLegacyEvent, type CalendarBackup, type ImportPreview } from "./import-export";
import { readLegacyLocalEvents } from "./local-storage";
import type { CalendarEvent, CalendarEventUpdate, NewCalendarEvent } from "./model";

export type ReplaceResult = { events: CalendarEvent[]; tasks: unknown[] | null };

export interface EventRepository {
  list(): CalendarEvent[];
  create(input: NewCalendarEvent): CalendarEvent;
  update(id: string, input: CalendarEventUpdate): CalendarEvent;
  delete(id: string): void;
  replaceAll(preview: ImportPreview): ReplaceResult;
  createBackup(tasks: unknown[]): CalendarBackup;
  markBackupCreated(): void;
}

type RepositoryOptions = {
  fallbackEvents?: CalendarEvent[];
  createId?: () => string;
  now?: () => Date;
};

const EVENTS_KEY = "nus_semicon_events_ay2627";
const TODOS_KEY = "nus_semicon_todos_ay2627";
const EDIT_KEY = "nus_semicon_last_edit_ay2627";
const BACKUP_KEY = "nus_semicon_last_backup_ay2627";

export class LocalStorageEventRepository implements EventRepository {
  private readonly fallbackEvents: CalendarEvent[];
  private readonly createId: () => string;
  private readonly now: () => Date;

  constructor(private readonly storage: Storage, options: RepositoryOptions = {}) {
    this.fallbackEvents = options.fallbackEvents ?? [];
    this.createId = options.createId ?? (() => crypto.randomUUID());
    this.now = options.now ?? (() => new Date());
  }

  list() {
    const result = readLegacyLocalEvents(this.storage);
    return result.source === "legacy-local-storage" ? result.events : this.fallbackEvents;
  }

  create(input: NewCalendarEvent) {
    const localId = `local-ay2627-${this.createId()}`;
    const event: CalendarEvent = {
      schemaVersion: 1, id: localId, legacyId: localId,
      academicYear: "AY2026/27", ...input,
    };
    this.write([...this.list(), event]);
    return event;
  }

  update(id: string, input: CalendarEventUpdate) {
    const events = this.list();
    const current = events.find((event) => event.id === id);
    if (!current) throw new Error("The event no longer exists in this calendar.");
    const event: CalendarEvent = { ...current, public: input.public, planning: input.planning };
    this.write(events.map((item) => item.id === id ? event : item));
    return event;
  }

  delete(id: string) {
    this.write(this.list().filter((event) => event.id !== id));
  }

  replaceAll(preview: ImportPreview): ReplaceResult {
    const previousEvents = this.storage.getItem(EVENTS_KEY);
    const previousTodos = this.storage.getItem(TODOS_KEY);
    try {
      this.write(preview.events);
      if (preview.todos) this.storage.setItem(TODOS_KEY, JSON.stringify(preview.todos));
      const verified = readLegacyLocalEvents(this.storage);
      if (verified.events.length !== preview.events.length) throw new Error("The imported events could not be verified after saving.");
      return { events: verified.events, tasks: preview.todos };
    } catch (error) {
      this.restore(EVENTS_KEY, previousEvents);
      this.restore(TODOS_KEY, previousTodos);
      throw error;
    }
  }

  createBackup(tasks: unknown[]) {
    return createCalendarBackup(this.list(), tasks, this.now());
  }

  markBackupCreated() {
    this.storage.setItem(BACKUP_KEY, this.now().toISOString());
  }

  private write(events: CalendarEvent[]) {
    this.storage.setItem(EVENTS_KEY, JSON.stringify(events.map(toLegacyEvent)));
    this.storage.setItem(EDIT_KEY, this.now().toISOString());
  }

  private restore(key: string, value: string | null) {
    if (value === null) this.storage.removeItem(key);
    else this.storage.setItem(key, value);
  }
}
