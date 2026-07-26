import type { Weekday } from "./model";
import { WEEKDAYS } from "./model";

export type AcademicWeekKind = "normal" | "recess" | "reading" | "exam" | "vac";

export type AcademicWeek = {
  id: string;
  semester: 1 | 2;
  label: string;
  monday: string;
  kind: AcademicWeekKind;
  span: number;
};

const normalWeeks = (semester: 1 | 2, starts: string[]): AcademicWeek[] =>
  starts.map((monday, index) => ({
    id: `s${semester}w${semester === 1 ? index : index + 1}`,
    semester,
    label: `Week ${semester === 1 ? index : index + 1}`,
    monday,
    kind: "normal",
    span: 7,
  }));

export const AY2627_WEEKS: AcademicWeek[] = [
  ...normalWeeks(1, ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14"]),
  { id: "s1wr_1", semester: 1, label: "Recess (1/2)", monday: "2026-09-19", kind: "recess", span: 7 },
  { id: "s1wr_2", semester: 1, label: "Recess (2/2)", monday: "2026-09-26", kind: "recess", span: 2 },
  ...normalWeeks(1, ["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"]).map((week, index) => ({ ...week, id: `s1w${index + 7}`, label: `Week ${index + 7}` })),
  { id: "s1rd", semester: 1, label: "Reading", monday: "2026-11-14", kind: "reading", span: 7 },
  ...["2026-11-21", "2026-11-28", "2026-12-05"].map((monday, index): AcademicWeek => ({ id: `s1e1_${index + 1}`, semester: 1, label: `Exam (${index + 1}/3)`, monday, kind: "exam", span: index === 2 ? 1 : 7 })),
  ...["2026-12-06", "2026-12-13", "2026-12-20", "2026-12-27", "2027-01-03", "2027-01-10"].map((monday, index): AcademicWeek => ({ id: `s1vac_${index + 1}`, semester: 1, label: `Vacation (${index + 1}/6)`, monday, kind: "vac", span: index === 5 ? 1 : 7 })),
  ...normalWeeks(2, ["2027-01-11", "2027-01-18", "2027-01-25", "2027-02-01", "2027-02-08", "2027-02-15"]),
  { id: "s2wr_1", semester: 2, label: "Recess (1/2)", monday: "2027-02-20", kind: "recess", span: 7 },
  { id: "s2wr_2", semester: 2, label: "Recess (2/2)", monday: "2027-02-27", kind: "recess", span: 2 },
  ...normalWeeks(2, ["2027-03-01", "2027-03-08", "2027-03-15", "2027-03-22", "2027-03-29", "2027-04-05", "2027-04-12"]).map((week, index) => ({ ...week, id: `s2w${index + 7}`, label: `Week ${index + 7}` })),
  { id: "s2rd", semester: 2, label: "Reading", monday: "2027-04-17", kind: "reading", span: 7 },
  ...["2027-04-24", "2027-05-01", "2027-05-08"].map((monday, index): AcademicWeek => ({ id: `s2e1_${index + 1}`, semester: 2, label: `Exam (${index + 1}/3)`, monday, kind: "exam", span: index === 2 ? 1 : 7 })),
  ...["2027-05-09", "2027-05-16", "2027-05-23", "2027-05-30", "2027-06-06", "2027-06-13", "2027-06-20", "2027-06-27", "2027-07-04", "2027-07-11", "2027-07-18", "2027-07-25", "2027-08-01"].map((monday, index): AcademicWeek => ({ id: `s2vac_${index + 1}`, semester: 2, label: `Vacation (${index + 1}/13)`, monday, kind: "vac", span: index === 12 ? 1 : 7 })),
];

const weekById = new Map(AY2627_WEEKS.map((week) => [week.id, week]));

export function academicDateToISO(weekId: string, day: Weekday): string | null {
  const week = weekById.get(weekId);
  const offset = WEEKDAYS.indexOf(day);
  if (!week || offset < 0 || offset >= week.span) return null;
  const [year, month, date] = week.monday.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, date + offset));
  return result.toISOString().slice(0, 10);
}
