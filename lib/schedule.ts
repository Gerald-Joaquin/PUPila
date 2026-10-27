/**
 * lib/schedule.ts
 * Pure utility functions for the schedule timetable. No I/O, no side-effects.
 */

import type { ClassSchedule, DayOfWeek } from "@/types"

// ── Time helpers ───────────────────────────────────────────────────────

/** "08:30" → 510 (minutes since midnight) */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + (m ?? 0)
}

/** 510 → "8:30 AM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number)
  const ampm = h < 12 ? "AM" : "PM"
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

/** "08:30", "09:30" → "8:30 – 9:30 AM" */
export function formatRange(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const ampm  = eh < 12 ? "AM" : "PM"
  const sh12  = sh % 12 || 12
  const eh12  = eh % 12 || 12
  const sStr  = `${sh12}:${String(sm).padStart(2, "0")}`
  const eStr  = `${eh12}:${String(em).padStart(2, "0")}`
  // omit AM/PM on start if same period
  const startAmpm = (sh < 12) === (eh < 12) ? "" : (sh < 12 ? " AM" : " PM")
  return `${sStr}${startAmpm} – ${eStr} ${ampm}`
}

// ── Grid layout constants ──────────────────────────────────────────────

/** Grid starts at 07:30 */
export const GRID_START_MIN = toMinutes("07:30")
/** Grid ends at 18:00 */
export const GRID_END_MIN   = toMinutes("18:00")
/** px width per 30-minute slot */
export const SLOT_W = 60

/** Returns { left, width } in px for a class block */
export function getBlockPosition(
  time_start: string,
  time_end:   string,
): { left: number; width: number } {
  const startMin = toMinutes(time_start) - GRID_START_MIN
  const endMin   = toMinutes(time_end)   - GRID_START_MIN
  return {
    left:  Math.max(0, (startMin / 30) * SLOT_W),
    width: Math.max(SLOT_W, ((endMin - startMin) / 30) * SLOT_W),
  }
}

// ── Conflict detection ────────────────────────────────────────────────

/** Returns a copy of classes with `.conflict = true` on overlapping pairs */
export function detectConflicts(classes: ClassSchedule[]): ClassSchedule[] {
  const result = classes.map(c => ({ ...c, conflict: false }))

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i]
      const b = result[j]
      if (!a.day || !b.day || a.day !== b.day) continue
      if (!a.time_start || !a.time_end || !b.time_start || !b.time_end) continue

      const aStart = toMinutes(a.time_start)
      const aEnd   = toMinutes(a.time_end)
      const bStart = toMinutes(b.time_start)
      const bEnd   = toMinutes(b.time_end)

      if (aStart < bEnd && bStart < aEnd) {
        result[i].conflict = true
        result[j].conflict = true
      }
    }
  }

  return result
}

// ── Schedule summary ──────────────────────────────────────────────────

export interface ScheduleSummary {
  totalSubjects:  number
  totalUnits:     number
  classDays:      number
  earliestStart:  string | null
  latestEnd:      string | null
}

export function buildSummary(classes: ClassSchedule[]): ScheduleSummary {
  const scheduled = classes.filter(c => c.day && c.time_start && c.time_end)
  const days = new Set(scheduled.map(c => c.day))

  const starts = scheduled.map(c => toMinutes(c.time_start!)).sort((a, b) => a - b)
  const ends   = scheduled.map(c => toMinutes(c.time_end!)).sort((a, b) => b - a)

  const toHHMM = (mins: number): string => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  return {
    totalSubjects: classes.length,
    totalUnits:    classes.reduce((s, c) => s + c.units, 0),
    classDays:     days.size,
    earliestStart: starts.length ? toHHMM(starts[0]) : null,
    latestEnd:     ends.length   ? toHHMM(ends[0])   : null,
  }
}

// ── Colour palette for subject blocks ─────────────────────────────────

const ACCENTS = [
  { bg: "linear-gradient(135deg,#8B1A1A,#A31F1F)", text: "#FFFFFF" }, // maroon
  { bg: "linear-gradient(135deg,#C26A0A,#E8590C)", text: "#FFFFFF" }, // orange
  { bg: "linear-gradient(135deg,#7C5CD8,#9775E8)", text: "#FFFFFF" }, // purple
  { bg: "linear-gradient(135deg,#0D7C66,#15A589)", text: "#FFFFFF" }, // teal
  { bg: "linear-gradient(135deg,#1D4ED8,#3B82F6)", text: "#FFFFFF" }, // blue
]

export function subjectAccent(code: string): { bg: string; text: string } {
  let hash = 0
  for (const ch of code) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return ACCENTS[hash % ACCENTS.length]
}

// ── Day helpers ───────────────────────────────────────────────────────

export const DAYS: DayOfWeek[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
]

export function todayName(): DayOfWeek | null {
  const names: (DayOfWeek | undefined)[] = [
    undefined, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ]
  return names[new Date().getDay()] ?? null
}

/** Whether a time falls in a standard class-hours band (Mon–Fri 08–12 or 13–17) */
export function isClassHour(col: number, dayIndex: number): boolean {
  const startMin = GRID_START_MIN + col * 30
  const h = Math.floor(startMin / 60)
  if (dayIndex >= 5) return false // Saturday
  return (h >= 8 && h < 12) || (h >= 13 && h < 17)
}
