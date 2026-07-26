import { EVENT_TEAMS, type CalendarEvent, type EventTeam } from "./model";
import { LEGACY_EDIT_TIMESTAMP_KEY, LEGACY_TODOS_STORAGE_KEY } from "./import-export";

export type EventPlanningTask = {
  id: number | string;
  text: string;
  done: boolean;
  teams: EventTeam[];
  eventLegacyId: number | string | null;
  due: string | null;
  owner: string | null;
  description: string;
  links: unknown[];
  images: unknown[];
};

const validTeam = (value: unknown): value is EventTeam =>
  typeof value === "string" && EVENT_TEAMS.includes(value as EventTeam);

export function normalizePlanningTask(value: unknown): EventPlanningTask | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const task = value as Record<string, unknown>;
  if ((typeof task.id !== "number" && typeof task.id !== "string") || typeof task.text !== "string" || !task.text.trim()) return null;
  const rawTeams = Array.isArray(task.cats) ? task.cats : task.cat ? [task.cat] : [];
  return {
    id: task.id,
    text: task.text.trim(),
    done: task.done === true,
    teams: rawTeams.filter(validTeam),
    eventLegacyId: typeof task.eventId === "number" || typeof task.eventId === "string" ? task.eventId : null,
    due: typeof task.due === "string" && task.due ? task.due : null,
    owner: typeof task.owner === "string" && task.owner ? task.owner : null,
    description: typeof task.desc === "string" ? task.desc : "",
    links: Array.isArray(task.links) ? task.links : [],
    images: Array.isArray(task.images) ? task.images : [],
  };
}

export function readPlanningTasks(storage: Pick<Storage, "getItem">): EventPlanningTask[] {
  const raw = storage.getItem(LEGACY_TODOS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.flatMap((task) => normalizePlanningTask(task) ?? []) : [];
  } catch {
    return [];
  }
}

export function writePlanningTasks(storage: Pick<Storage, "setItem">, tasks: EventPlanningTask[]) {
  storage.setItem(LEGACY_TODOS_STORAGE_KEY, JSON.stringify(tasks.map((task) => ({
    id: task.id,
    text: task.text,
    done: task.done,
    cats: task.teams,
    eventId: task.eventLegacyId,
    due: task.due,
    owner: task.owner,
    desc: task.description,
    links: task.links,
    images: task.images,
  }))));
  storage.setItem(LEGACY_EDIT_TIMESTAMP_KEY, new Date().toISOString());
}

export function taskEvent(task: EventPlanningTask, events: CalendarEvent[]) {
  return events.find((event) => event.legacyId === task.eventLegacyId) ?? null;
}
