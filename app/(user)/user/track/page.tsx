"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Printer, Calendar, List, Sun, Cloud, AlertTriangle, RefreshCw } from "lucide-react"
import type { ClassSchedule, Enrollment, DayOfWeek, EnrollmentStatus } from "@/types"
import {
  DAYS, todayName, toMinutes, formatTime, formatRange,
  getBlockPosition, detectConflicts, buildSummary,
  subjectAccent, isClassHour,
  GRID_START_MIN, GRID_END_MIN, SLOT_W,
} from "@/lib/schedule"

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────
const LS_KEY    = "pupila_enr"
const ROW_H     = 90   // px per day row
const HDR_W     = 96   // px for the sticky day-name column
const COLS      = (GRID_END_MIN - GRID_START_MIN) / 30  // number of 30-min slots

// ─────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const cfg = {
    confirmed: { bg: "#D1FAE5", color: "#065F46", label: "Confirmed" },
    pending:   { bg: "#FEF3C7", color: "#92400E", label: "Pending"   },
    rejected:  { bg: "#FEE2E2", color: "#991B1B", label: "Rejected"  },
  }[status]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "11px", fontWeight: 700, padding: "3px 10px",
      borderRadius: "9999px", backgroundColor: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: "28px 28px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
      {[220, 160, 340].map(w => (
        <div key={w} style={{ height: 18, width: w, borderRadius: 8, background: "linear-gradient(90deg,#E5E9F0 25%,#F4F6FA 50%,#E5E9F0 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite" }} />
      ))}
      <div style={{ height: 200, borderRadius: 16, background: "linear-gradient(90deg,#E5E9F0 25%,#F4F6FA 50%,#E5E9F0 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite" }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ENR input card (shown when no ENR is stored)
// ─────────────────────────────────────────────────────────────────────
function EnrPrompt({ onEnr }: { onEnr: (enr: string) => void }) {
  const [val, setVal] = useState("")
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = val.trim().toUpperCase()
    if (t) onEnr(t)
  }
  return (
    <div style={{ padding: "28px 28px 48px", display: "flex", justifyContent: "center" }}>
      <div style={{
        backgroundColor: "#FFFFFF", borderRadius: 20, border: "1px solid #EEF0F5",
        boxShadow: "0 10px 30px rgba(139,26,26,0.08)", padding: "32px 28px",
        maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#1E2A3A", margin: 0 }}>View Your Schedule</p>
          <p style={{ fontSize: 13, color: "#6B7A8C", margin: "4px 0 0" }}>Enter your ENR number to load your timetable.</p>
        </div>
        <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="ENR-00001-MN-0"
            style={{
              flex: 1, border: "1px solid #E5E9F0", borderRadius: 10,
              padding: "10px 14px", fontSize: 13, color: "#1E2A3A",
              outline: "none", fontFamily: "monospace",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#8B1A1A")}
            onBlur={e  => (e.currentTarget.style.borderColor = "#E5E9F0")}
          />
          <button type="submit" disabled={!val.trim()} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#8B1A1A,#A31F1F)",
            color: "#FFF", fontSize: 13, fontWeight: 600,
            cursor: val.trim() ? "pointer" : "default",
            opacity: val.trim() ? 1 : 0.55, transition: "opacity .15s",
          }}>
            View
          </button>
        </form>
        <Link href="/user/enroll" style={{ fontSize: 12, color: "#8B1A1A", textDecoration: "none", textAlign: "center", fontWeight: 600 }}>
          Don&apos;t have an ENR? Start enrollment →
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Summary strip
// ─────────────────────────────────────────────────────────────────────
function SummaryStrip({ classes }: { classes: ClassSchedule[] }) {
  const s = buildSummary(classes)
  const items = [
    { label: "Subjects",       value: String(s.totalSubjects) },
    { label: "Units",          value: String(s.totalUnits) },
    { label: "Class days",     value: String(s.classDays) },
    { label: "Earliest start", value: s.earliestStart ? formatTime(s.earliestStart) : "—" },
    { label: "Latest end",     value: s.latestEnd     ? formatTime(s.latestEnd)     : "—" },
  ]
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10,
      padding: "0 0 16px",
    }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{
          backgroundColor: "#FFFFFF", border: "1px solid #EEF0F5",
          borderRadius: 12, padding: "10px 16px", display: "flex", flexDirection: "column", gap: 2,
          minWidth: 90,
        }}>
          <span style={{ fontSize: 11, color: "#6B7A8C", fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1E2A3A" }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────
interface TooltipData { cls: ClassSchedule; x: number; y: number }

function Tooltip({ data, onClose }: { data: TooltipData; onClose: () => void }) {
  const { cls, x, y } = data
  const accent = subjectAccent(cls.subject_code)
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
      <div style={{
        position: "fixed", left: Math.min(x + 12, window.innerWidth - 260), top: Math.min(y - 10, window.innerHeight - 200),
        zIndex: 100, backgroundColor: "#FFFFFF", border: "1px solid #EEF0F5",
        borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
        padding: "14px 16px", width: 240, pointerEvents: "auto",
      }}>
        <div style={{ width: 32, height: 4, borderRadius: 9999, background: accent.bg, marginBottom: 10 }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1E2A3A", margin: "0 0 4px" }}>{cls.subject_code}</p>
        <p style={{ fontSize: 12, color: "#6B7A8C", margin: "0 0 10px", lineHeight: 1.4 }}>{cls.subject_name}</p>
        {[
          ["Units",      String(cls.units)],
          cls.instructor ? ["Instructor", cls.instructor] : null,
          cls.room       ? ["Room",       cls.room]       : null,
          cls.time_start && cls.time_end
            ? ["Time", formatRange(cls.time_start, cls.time_end)]
            : null,
        ].filter(Boolean).map(row => (
          <div key={row![0]} style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: "#9BA4B0", width: 68, flexShrink: 0 }}>{row![0]}</span>
            <span style={{ color: "#1E2A3A", fontWeight: 500 }}>{row![1]}</span>
          </div>
        ))}
        {cls.conflict && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#D92D20", fontWeight: 600 }}>
            <AlertTriangle size={11} /> Time conflict detected
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Timetable (Week view)
// ─────────────────────────────────────────────────────────────────────
function WeekView({ classes }: { classes: ClassSchedule[] }) {
  const withConflicts = detectConflicts(classes.filter(c => c.day && c.time_start && c.time_end))
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [nowMin, setNowMin]   = useState<number>(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const today   = todayName()

  // "now" line — updated every minute
  useEffect(() => {
    const update = () => {
      const d = new Date()
      setNowMin(d.getHours() * 60 + d.getMinutes())
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll to first class on load
  useEffect(() => {
    if (!gridRef.current) return
    const todayClasses = withConflicts.filter(c => c.day === today && c.time_start)
    if (!todayClasses.length) return
    const earliest = todayClasses.reduce((a, b) =>
      toMinutes(a.time_start!) < toMinutes(b.time_start!) ? a : b
    )
    const { left } = getBlockPosition(earliest.time_start!, earliest.time_end ?? earliest.time_start!)
    gridRef.current.scrollLeft = Math.max(0, left - 20)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Column headers: 07:30, 08:00, 08:30 …
  const colHeaders: string[] = []
  for (let i = 0; i < COLS; i++) {
    const totalMins = GRID_START_MIN + i * 30
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    colHeaders.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }

  const totalW = HDR_W + COLS * SLOT_W

  return (
    <>
    {tooltip && <Tooltip data={tooltip} onClose={() => setTooltip(null)} />}

    <div style={{
      backgroundColor: "#FFFFFF", borderRadius: 20,
      border: "1px solid #E5E9F0",
      boxShadow: "0 10px 30px rgba(139,26,26,0.08)",
      overflow: "hidden",
    }}>
      {/* Scrollable container */}
      <div
        ref={gridRef}
        className="schedule-scroll"
        style={{ overflowX: "auto", overflowY: "hidden", position: "relative" }}
      >
        <div style={{ minWidth: totalW, position: "relative" }}>

          {/* ── Header row ── */}
          <div style={{
            display: "flex", position: "sticky", top: 0, zIndex: 10,
            backgroundColor: "#FAFBFC", borderBottom: "1px solid #E5E9F0",
          }}>
            {/* corner cell */}
            <div style={{
              width: HDR_W, flexShrink: 0, borderRight: "1px solid #E5E9F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#9BA4B0", height: 40,
            }}>DAY</div>

            {colHeaders.map((hdr, i) => {
              const isHour = hdr.endsWith(":00")
              return (
                <div key={hdr} style={{
                  width: SLOT_W, flexShrink: 0, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRight: i < COLS - 1 ? "1px solid #F4F6FA" : "none",
                  fontSize: isHour ? 11 : 10,
                  fontWeight: isHour ? 700 : 500,
                  color: isHour ? "#1E2A3A" : "#6B7A8C",
                }}>
                  {isHour ? hdr : hdr.slice(3)}
                </div>
              )
            })}
          </div>

          {/* ── Day rows ── */}
          {DAYS.map((day, di) => {
            const dayClasses = withConflicts.filter(c => c.day === day)
            const isToday    = day === today
            const isSat      = day === "Saturday"

            return (
              <div key={day} style={{
                display: "flex", position: "relative",
                borderBottom: di < DAYS.length - 1 ? "1px solid #E5E9F0" : "none",
                backgroundColor: isToday ? "#FBEAEA" : "transparent",
              }}>
                {/* Sticky day-name cell */}
                <div style={{
                  width: HDR_W, flexShrink: 0, height: ROW_H,
                  position: "sticky", left: 0, zIndex: 5,
                  backgroundColor: isToday ? "#FBEAEA" : "#FAFBFC",
                  borderRight: "1px solid #E5E9F0",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  {isSat
                    ? <Cloud size={14} color="#9BA4B0" />
                    : <Sun size={14} color="#F5B301" />}
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: isToday ? "#8B1A1A" : "#1E2A3A",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {day.slice(0, 3)}
                  </span>
                  {isToday && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#8B1A1A", letterSpacing: "0.08em" }}>TODAY</span>
                  )}
                </div>

                {/* Background column cells */}
                <div style={{ position: "relative", flex: 1, height: ROW_H, display: "flex" }}>
                  {colHeaders.map((hdr, ci) => (
                    <div key={hdr} style={{
                      width: SLOT_W, flexShrink: 0, height: "100%",
                      borderRight: ci < COLS - 1 ? "1px solid #F0F2F6" : "none",
                      backgroundColor: isClassHour(ci, di) ? "#F0FDF8" : "transparent",
                    }} />
                  ))}

                  {/* "Now" vertical line (today only) */}
                  {isToday && nowMin >= GRID_START_MIN && nowMin <= GRID_END_MIN && (
                    <div style={{
                      position: "absolute", top: 0, bottom: 0,
                      left: ((nowMin - GRID_START_MIN) / 30) * SLOT_W,
                      width: 2, backgroundColor: "#8B1A1A", zIndex: 4,
                      borderRadius: 2,
                    }} />
                  )}

                  {/* Class blocks */}
                  {dayClasses.map((cls, ci) => {
                    if (!cls.time_start || !cls.time_end) return null
                    const { left, width } = getBlockPosition(cls.time_start, cls.time_end)
                    const accent = subjectAccent(cls.subject_code)
                    const isPending  = cls.status === "pending"
                    const isConflict = cls.conflict

                    // vertical offset for overlapping blocks
                    const blockH   = ROW_H - 12
                    const topOff   = 6

                    return (
                      <div
                        key={`${cls.subject_code}-${ci}`}
                        onClick={e => setTooltip({ cls, x: e.clientX, y: e.clientY })}
                        style={{
                          position: "absolute",
                          left, width: width - 4,
                          top: topOff, height: blockH,
                          background: isPending ? "transparent" : accent.bg,
                          backgroundColor: isPending ? "#FFFBEB" : undefined,
                          border: isConflict
                            ? "2px solid #D92D20"
                            : isPending
                            ? "2px dashed #F5B301"
                            : "none",
                          borderRadius: 12,
                          padding: "8px 10px",
                          cursor: "pointer",
                          overflow: "hidden",
                          zIndex: isConflict ? 3 : 2,
                          boxShadow: isConflict ? "0 0 0 2px rgba(217,45,32,0.15)" : "0 2px 6px rgba(0,0,0,0.12)",
                          transition: "transform .1s, box-shadow .1s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = isConflict ? "0 0 0 2px rgba(217,45,32,0.15)" : "0 2px 6px rgba(0,0,0,0.12)" }}
                      >
                        <p style={{
                          fontSize: 11, fontWeight: 700, margin: 0, lineHeight: 1.2,
                          color: isPending ? "#92400E" : accent.text,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {isConflict && "⚠ "}{cls.subject_code}
                        </p>
                        {blockH > 36 && (
                          <p style={{
                            fontSize: 10, margin: "2px 0 0", lineHeight: 1.2,
                            color: isPending ? "#78350F" : "rgba(255,255,255,0.85)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {cls.subject_name}
                          </p>
                        )}
                        {blockH > 54 && cls.room && (
                          <p style={{ fontSize: 9, margin: "2px 0 0", color: isPending ? "#92400E" : "rgba(255,255,255,0.70)" }}>
                            {cls.room}
                          </p>
                        )}
                        {isPending && (
                          <span style={{
                            position: "absolute", bottom: 4, right: 6,
                            fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                            color: "#92400E", textTransform: "uppercase",
                          }}>Pending</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", gap: 16, padding: "10px 16px",
        borderTop: "1px solid #E5E9F0", flexWrap: "wrap",
      }}>
        {[
          { label: "Confirmed", bg: "linear-gradient(135deg,#8B1A1A,#A31F1F)", border: "none" },
          { label: "Pending",   bg: "#FFFBEB",  border: "2px dashed #F5B301" },
          { label: "Conflict",  bg: "#FEE2E2",  border: "2px solid #D92D20"  },
        ].map(({ label, bg, border }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6B7A8C" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// List view
// ─────────────────────────────────────────────────────────────────────
function ListView({ classes }: { classes: ClassSchedule[] }) {
  const today = todayName()
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {DAYS.map(day => {
        const dayClasses = classes
          .filter(c => c.day === day && c.time_start)
          .sort((a, b) => toMinutes(a.time_start!) - toMinutes(b.time_start!))
        const isToday = day === today

        return (
          <div key={day} style={{
            backgroundColor: "#FFFFFF", border: `1px solid ${isToday ? "#FBEAEA" : "#EEF0F5"}`,
            borderRadius: 16, overflow: "hidden",
            boxShadow: isToday ? "0 4px 16px rgba(139,26,26,0.08)" : "none",
          }}>
            <div style={{
              padding: "10px 16px", borderBottom: "1px solid #EEF0F5",
              display: "flex", alignItems: "center", gap: 8,
              backgroundColor: isToday ? "#FBEAEA" : "#F8F9FB",
            }}>
              {day === "Saturday" ? <Cloud size={14} color="#9BA4B0" /> : <Sun size={14} color="#F5B301" />}
              <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#8B1A1A" : "#1E2A3A" }}>{day}</span>
              {isToday && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#8B1A1A", backgroundColor: "#FBEAEA", border: "1px solid rgba(139,26,26,0.2)", borderRadius: 9999, padding: "2px 8px" }}>Today</span>
              )}
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#9BA4B0" }}>
                {dayClasses.length} {dayClasses.length === 1 ? "class" : "classes"}
              </span>
            </div>

            {dayClasses.length === 0 ? (
              <p style={{ padding: "14px 16px", fontSize: 13, color: "#9BA4B0" }}>No classes</p>
            ) : (
              dayClasses.map((cls, i) => {
                const accent = subjectAccent(cls.subject_code)
                return (
                  <div key={`${cls.subject_code}-${i}`} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px",
                    borderBottom: i < dayClasses.length - 1 ? "1px solid #F4F6FA" : "none",
                  }}>
                    <div style={{ width: 4, height: 36, borderRadius: 4, background: accent.bg, flexShrink: 0 }} />
                    <div style={{ minWidth: 56 }}>
                      <p style={{ fontSize: 11, color: "#9BA4B0", margin: 0, fontWeight: 500 }}>
                        {cls.time_start && cls.time_end ? formatRange(cls.time_start, cls.time_end) : "TBA"}
                      </p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1E2A3A", margin: 0 }}>{cls.subject_code}</p>
                      <p style={{ fontSize: 12, color: "#6B7A8C", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.subject_name}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {cls.room && <p style={{ fontSize: 11, color: "#9BA4B0", margin: 0 }}>{cls.room}</p>}
                      {cls.instructor && <p style={{ fontSize: 11, color: "#9BA4B0", margin: "2px 0 0" }}>{cls.instructor}</p>}
                    </div>
                    <StatusBadge status={cls.status} />
                  </div>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Unscheduled subjects
// ─────────────────────────────────────────────────────────────────────
function Unscheduled({ classes }: { classes: ClassSchedule[] }) {
  const unscheduled = classes.filter(c => !c.day || !c.time_start)
  if (unscheduled.length === 0) return null
  return (
    <div style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 16, padding: "16px 20px" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", margin: "0 0 10px" }}>
        Unscheduled Subjects
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {unscheduled.map(cls => (
          <div key={cls.subject_code} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E", fontFamily: "monospace" }}>{cls.subject_code}</span>
            <span style={{ fontSize: 12, color: "#78350F" }}>{cls.subject_name}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#A16207", fontStyle: "italic" }}>Schedule to be announced</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────
function ScheduleContent() {
  const searchParams  = useSearchParams()
  const queryEnr      = searchParams.get("enr")

  const [enr,        setEnr]        = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [view,       setView]       = useState<"week" | "list">("week")

  // Read localStorage and URL param — inside useEffect to avoid hydration errors
  useEffect(() => {
    const fromUrl = queryEnr?.trim().toUpperCase() ?? null
    const fromLS  = localStorage.getItem(LS_KEY)
    const resolved = fromUrl ?? fromLS ?? null
    if (resolved) setEnr(resolved)
  }, [queryEnr])

  // Default to List on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setView("list")
  }, [])

  // Fetch when enr changes
  const fetchEnrollment = useCallback(async (enrNum: string) => {
    setLoading(true)
    setError(null)
    setEnrollment(null)
    try {
      const res = await fetch(`/api/enrollments/${encodeURIComponent(enrNum)}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? "Enrollment not found.")
        return
      }
      const data: Enrollment = await res.json()
      setEnrollment(data)
      localStorage.setItem(LS_KEY, enrNum)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enr) void fetchEnrollment(enr)
  }, [enr, fetchEnrollment])

  // Build ClassSchedule[] from enrollment subjects
  // In a real app, schedule details come from a separate table.
  // Here we derive from subjects (days/times would be in the DB).
  const classes: ClassSchedule[] = enrollment?.subjects.map(s => ({
    subject_code: s.code,
    subject_name: s.name,
    units:        s.units,
    day:          null,        // real data comes from schedule table
    time_start:   null,
    time_end:     null,
    room:         "",
    instructor:   "",
    status:       enrollment.status,
  })) ?? []

  function handleChangeEnr() {
    setEnr(null)
    setEnrollment(null)
    setError(null)
    localStorage.removeItem(LS_KEY)
  }

  const statusBgMap: Record<EnrollmentStatus, string> = {
    confirmed: "#F0FDF4",
    pending:   "#FFFBEB",
    rejected:  "#FFF1F1",
  }

  return (
    <div className="schedule-page" style={{ display: "flex", flexDirection: "column", minHeight: "100%", backgroundColor: "#F4F6FA" }}>

      {/* ── Top bar ── */}
      <div style={{
        backgroundColor: "#FFFFFF", borderBottom: "1px solid #EEF0F5",
        padding: "14px 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "#1E2A3A", margin: 0 }}>My Schedule</h1>
            {enrollment && <StatusBadge status={enrollment.status} />}
          </div>
          <p style={{ fontSize: 11, color: "#6B7A8C", margin: 0 }}>
            {enrollment
              ? `${enrollment.semester} · ${enrollment.academic_year} · ${enrollment.program} · ${enrollment.year_level}`
              : "AY 2025–2026 · 1st Semester"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {enrollment && (
            <>
              {/* View toggle */}
              <div style={{
                display: "flex", border: "1px solid #E5E9F0", borderRadius: 10,
                overflow: "hidden", backgroundColor: "#F8F9FB",
              }}>
                {(["week", "list"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    backgroundColor: view === v ? "#FFFFFF" : "transparent",
                    color: view === v ? "#8B1A1A" : "#6B7A8C",
                    boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all .15s",
                  }}>
                    {v === "week" ? <Calendar size={12} /> : <List size={12} />}
                    {v === "week" ? "Week" : "List"}
                  </button>
                ))}
              </div>

              {/* Print */}
              <button
                onClick={() => window.print()}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", border: "1px solid #E5E9F0", borderRadius: 10,
                  backgroundColor: "#F8F9FB", color: "#6B7A8C",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Printer size={12} /> Print
              </button>

              {/* Refresh */}
              <button
                onClick={() => void fetchEnrollment(enr!)}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", border: "1px solid #E5E9F0", borderRadius: 10,
                  backgroundColor: "#F8F9FB", color: "#6B7A8C",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
                Refresh
              </button>
            </>
          )}

          {enr && !loading && (
            <button
              onClick={handleChangeEnr}
              style={{
                fontSize: 11, fontWeight: 600, color: "#8B1A1A",
                background: "none", border: "none", cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Change ENR
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: "1 1 0", overflowY: "auto", padding: "20px 28px 40px" }}>

        {/* Loading */}
        {loading && <Skeleton />}

        {/* No ENR stored yet */}
        {!loading && !enr && <EnrPrompt onEnr={e => setEnr(e)} />}

        {/* Error state */}
        {!loading && error && (
          <div style={{
            backgroundColor: "#FFF1F1", border: "1px solid #FECACA",
            borderRadius: 16, padding: "20px 24px", maxWidth: 480,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#B91C1C", margin: 0 }}>Enrollment not found</p>
            <p style={{ fontSize: 13, color: "#7F1D1D", margin: 0 }}>{error}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleChangeEnr} style={{
                fontSize: 13, fontWeight: 600, color: "#8B1A1A",
                background: "none", border: "1px solid #8B1A1A",
                borderRadius: 8, padding: "6px 14px", cursor: "pointer",
              }}>Try another ENR</button>
              <Link href="/user/enroll" style={{
                fontSize: 13, fontWeight: 600, color: "#FFFFFF",
                background: "linear-gradient(135deg,#8B1A1A,#A31F1F)",
                borderRadius: 8, padding: "6px 14px", textDecoration: "none",
                display: "inline-flex", alignItems: "center",
              }}>Start enrollment</Link>
            </div>
          </div>
        )}

        {/* Pending notice */}
        {!loading && enrollment?.status === "pending" && (
          <div style={{
            backgroundColor: "#FFFBEB", border: "1px solid #FDE68A",
            borderRadius: 12, padding: "10px 16px", marginBottom: 16,
            fontSize: 13, color: "#92400E", display: "flex", gap: 8, alignItems: "center",
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            Your enrollment is pending approval — your schedule may change once confirmed.
          </div>
        )}

        {/* Rejected notice */}
        {!loading && enrollment?.status === "rejected" && (
          <div style={{
            backgroundColor: "#FFF1F1", border: "1px solid #FECACA",
            borderRadius: 12, padding: "10px 16px", marginBottom: 16,
            fontSize: 13, color: "#B91C1C", display: "flex", gap: 8, alignItems: "center",
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            Your enrollment was rejected. Please contact the Enrollment Office.
            <Link href="/user/enroll" style={{ marginLeft: "auto", color: "#8B1A1A", fontWeight: 600, textDecoration: "none" }}>Re-enroll</Link>
          </div>
        )}

        {/* Main content */}
        {!loading && enrollment && (
          <>
            {/* Status banner (coloured) */}
            <div style={{
              backgroundColor: statusBgMap[enrollment.status],
              border: "1px solid #EEF0F5", borderRadius: 14,
              padding: "12px 16px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <div>
                <span style={{ fontSize: 12, color: "#6B7A8C" }}>ENR: </span>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "#1E2A3A" }}>{enrollment.enr_number}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "#6B7A8C" }}>Student: </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1E2A3A" }}>{enrollment.full_name}</span>
              </div>
              <StatusBadge status={enrollment.status} />
            </div>

            <SummaryStrip classes={classes} />

            {view === "week"
              ? <WeekView classes={classes} />
              : <ListView classes={classes} />
            }

            <div style={{ marginTop: 20 }}>
              <Unscheduled classes={classes} />
            </div>
          </>
        )}
      </div>

      {/* Print styles + animations */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400% 0; }
          100% { background-position:  400% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Slim maroon scrollbar on the timetable */
        .schedule-scroll::-webkit-scrollbar             { height: 6px; }
        .schedule-scroll::-webkit-scrollbar-track       { background: transparent; }
        .schedule-scroll::-webkit-scrollbar-thumb       { background: rgba(139,26,26,0.25); border-radius: 9999px; }
        .schedule-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,26,26,0.50); }
        .schedule-scroll                                 { scrollbar-width: thin; scrollbar-color: rgba(139,26,26,0.25) transparent; }

        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          .schedule-page, .schedule-page * { visibility: visible !important; }
          .schedule-page { position: absolute; inset: 0; }
          button, a[href], .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ScheduleContent />
    </Suspense>
  )
}
