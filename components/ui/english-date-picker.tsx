"use client";

import { useRef, useState } from "react";
import { AccessibleDialog } from "./accessible-dialog";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
};

const pad = (value: number) => String(value).padStart(2, "0");
const toISODate = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

function parseISODate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day ? { year, month, day } : null;
}

export const isValidISODate = (value: string) => parseISODate(value) !== null;

function englishDateLabel(year: number, month: number, day: number) {
  const weekday = new Intl.DateTimeFormat("en-SG", { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, day)));
  return `${weekday}, ${MONTHS[month]} ${day}, ${year}`;
}

export function EnglishDatePicker({ value, onChange, invalid = false, describedBy }: Props) {
  const [open, setOpen] = useState(false);
  const initial = parseISODate(value);
  const today = new Date();
  const [visibleYear, setVisibleYear] = useState(initial?.year ?? today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(initial?.month ?? today.getMonth());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedDateRef = useRef<HTMLButtonElement>(null);

  const openPicker = () => {
    const selected = parseISODate(value);
    if (selected) { setVisibleYear(selected.year); setVisibleMonth(selected.month); }
    setOpen(true);
  };

  const moveMonth = (offset: number) => {
    const next = new Date(Date.UTC(visibleYear, visibleMonth + offset, 1));
    setVisibleYear(next.getUTCFullYear());
    setVisibleMonth(next.getUTCMonth());
  };

  const daysInMonth = new Date(Date.UTC(visibleYear, visibleMonth + 1, 0)).getUTCDate();
  const leadingBlanks = (new Date(Date.UTC(visibleYear, visibleMonth, 1)).getUTCDay() + 6) % 7;
  const selected = parseISODate(value);
  const selectedIsVisible = selected?.year === visibleYear && selected.month === visibleMonth;

  return (
    <div className="english-date-picker">
      <input type="text" inputMode="numeric" autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} placeholder="YYYY-MM-DD" aria-label="Due date (YYYY-MM-DD)" aria-invalid={invalid} aria-describedby={describedBy} />
      <button ref={triggerRef} type="button" className="date-picker-trigger" onClick={openPicker} aria-label="Choose due date" aria-haspopup="dialog">▦</button>
      {open && <AccessibleDialog className="date-picker-dialog" labelledBy="date-picker-title" onClose={() => setOpen(false)} initialFocusRef={selectedIsVisible ? selectedDateRef : undefined}>
        <div className="date-picker-header">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">←</button>
          <h3 id="date-picker-title">{MONTHS[visibleMonth]} {visibleYear}</h3>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">→</button>
        </div>
        <div className="date-picker-grid" role="grid" aria-labelledby="date-picker-title">
          {WEEKDAYS.map((day) => <span role="columnheader" key={day}>{day}</span>)}
          {Array.from({ length: leadingBlanks }, (_, index) => <span aria-hidden="true" key={`blank-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const isSelected = selectedIsVisible && selected?.day === day;
            return <button ref={isSelected ? selectedDateRef : undefined} type="button" role="gridcell" aria-selected={isSelected} aria-label={`Choose ${englishDateLabel(visibleYear, visibleMonth, day)}`} className={isSelected ? "selected" : ""} key={day} onClick={() => { onChange(toISODate(visibleYear, visibleMonth, day)); setOpen(false); }}>{day}</button>;
          })}
        </div>
        <div className="date-picker-actions">
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}>Clear</button>
          <button type="button" onClick={() => { const now = new Date(); onChange(toISODate(now.getFullYear(), now.getMonth(), now.getDate())); setOpen(false); }}>Today</button>
          <button type="button" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </AccessibleDialog>}
    </div>
  );
}
