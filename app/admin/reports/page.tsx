"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRole } from "@/components/RoleToggle"
import type { EnrollmentSummary, EnrollmentStatus, StudentType } from "@/types"

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  })
}

function startOfWeek(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  c.setDate(c.getDate() - c.getDay()) // Sunday
  return c
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isThisWeek(d: Date) {
  const now = new Date()
  const ws  = startOfWeek(now)
  const we  = new Date(ws); we.setDate(we.getDate() + 7)
  return d >= ws && d < we
}

// ── export helpers ─────────────────────────────────────────────────────────

function toCSV(rows: EnrollmentSummary[]): string {
  const header = ["ENR Number", "Full Name", "Student ID", "Type", "Year Level", "Program", "Status", "Date Enrolled"]
  const lines  = rows.map(r => [
    r.enr_number, r.full_name, r.student_id, r.student_type,
    r.year_level, r.program,   r.status,     formatDate(r.created_at),
  ].map(v => `"${v}"`).join(","))
  return [header.join(","), ...lines].join("\n")
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportCSV(rows: EnrollmentSummary[]) {
  downloadBlob(toCSV(rows), "pupila-enrollment-report.csv", "text/csv")
}

function exportExcel(rows: EnrollmentSummary[]) {
  // Excel-compatible XML spreadsheet — no external dependency
  const cols = ["ENR Number","Full Name","Student ID","Type","Year Level","Program","Status","Date Enrolled"]
  const esc  = (v: string) => v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  const cell = (v: string) => `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`
  const headerRow = `<Row>${cols.map(c => `<Cell ss:StyleID="h"><Data ss:Type="String">${esc(c)}</Data></Cell>`).join("")}</Row>`
  const dataRows  = rows.map(r =>
    `<Row>${[r.enr_number,r.full_name,r.student_id,r.student_type,r.year_level,r.program,r.status,formatDate(r.created_at)].map(cell).join("")}</Row>`
  ).join("")
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles><Worksheet ss:Name="Enrollments"><Table>${headerRow}${dataRows}</Table></Worksheet></Workbook>`
  downloadBlob(xml, "pupila-enrollment-report.xls", "application/vnd.ms-excel")
}

function exportPDF(rows: EnrollmentSummary[]) {
  const win = window.open("", "_blank")
  if (!win) return
  const esc = (v: string) => v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  const statusColor = (s: EnrollmentStatus) =>
    s === "confirmed" ? "#15803d" : s === "rejected" ? "#991b1b" : "#854d0e"
  const rows_html = rows.map(r => `
    <tr>
      <td style="font-family:monospace;font-size:11px">${esc(r.enr_number)}</td>
      <td>${esc(r.full_name)}</td>
      <td>${esc(r.student_id)}</td>
      <td style="text-transform:capitalize">${r.student_type}</td>
      <td>${esc(r.year_level)}</td>
      <td>${esc(r.program)}</td>
      <td style="color:${statusColor(r.status)};font-weight:600;text-transform:capitalize">${r.status}</td>
      <td>${formatDate(r.created_at)}</td>
    </tr>`).join("")
  win.document.write(`<!DOCTYPE html><html><head><title>PUPILA Enrollment Report</title>
    <style>
      body{font-family:system-ui,sans-serif;font-size:12px;color:#111;padding:24px}
      h1{font-size:18px;margin:0 0 4px;color:#7a1515}
      p.sub{font-size:11px;color:#6b7280;margin:0 0 16px}
      table{border-collapse:collapse;width:100%}
      th{background:#7a1515;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
      td{padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;vertical-align:middle}
      tr:nth-child(even) td{background:#f9fafb}
      @media print{button{display:none}}
    </style></head><body>
    <h1>PUPILA — Enrollment Report</h1>
    <p class="sub">Generated ${new Date().toLocaleString("en-PH")} · ${rows.length} record(s)</p>
    <table>
      <thead><tr>
        <th>ENR Number</th><th>Full Name</th><th>Student ID</th>
        <th>Type</th><th>Year Level</th><th>Program</th><th>Status</th><th>Date Enrolled</th>
      </tr></thead>
      <tbody>${rows_html}</tbody>
    </table>
    <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`)
  win.document.close()
}

// ── stat card ──────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl px-5 py-4 bg-white" style={{ border: accent ? "1px solid #7a1515" : "1px solid #e5e7eb" }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <p className="text-[32px] font-semibold leading-none" style={{ color: accent ? "#7a1515" : "#111827" }}>{value}</p>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

type FilterType   = "all" | StudentType
type FilterStatus = "all" | EnrollmentStatus

export default function ReportsPage() {
  const { isStaff }                         = useRole()
  const [rows,    setRows]                  = useState<EnrollmentSummary[]>([])
  const [loading, setLoading]               = useState(true)
  const [error,   setError]                 = useState<string | null>(null)
  const [typeFilter,   setTypeFilter]       = useState<FilterType>("all")
  const [statusFilter, setStatusFilter]     = useState<FilterStatus>("confirmed")

  const load = useCallback(async () => {
    if (!isStaff) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/enrollments", { headers: { "x-demo-role": "staff" } })
      if (!res.ok) throw new Error("Failed to load")
      setRows(await res.json())
    } catch {
      setError("Could not load enrollment data.")
    } finally {
      setLoading(false)
    }
  }, [isStaff])

  useEffect(() => { void load() }, [load])

  // ── derived data ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => rows.filter(r => {
    if (typeFilter   !== "all" && r.student_type !== typeFilter)   return false
    if (statusFilter !== "all" && r.status       !== statusFilter) return false
    return true
  }), [rows, typeFilter, statusFilter])

  const today     = new Date()
  const todayRows = rows.filter(r => isSameDay(new Date(r.created_at), today))
  const weekRows  = rows.filter(r => isThisWeek(new Date(r.created_at)))

  const regular   = rows.filter(r => r.student_type === "regular").length
  const irregular = rows.filter(r => r.student_type === "irregular").length
  const confirmed = rows.filter(r => r.status === "confirmed").length
  const pending   = rows.filter(r => r.status === "pending").length
  const rejected  = rows.filter(r => r.status === "rejected").length

  // ── not staff ─────────────────────────────────────────────────────────────

  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-400 text-sm">Staff access required to view reports.</p>
      </div>
    )
  }

  // ── filter pill ───────────────────────────────────────────────────────────

  function Pill<T extends string>({
    value, current, onSelect, label,
  }: { value: T; current: T; onSelect: (v: T) => void; label: string }) {
    const active = value === current
    return (
      <button
        onClick={() => onSelect(value)}
        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
        style={{
          background: active ? "#7a1515" : "#f3f4f6",
          color:      active ? "#ffffff" : "#374151",
          border:     active ? "1px solid #7a1515" : "1px solid #e5e7eb",
        }}
      >
        {label}
      </button>
    )
  }

  const statusColor = (s: EnrollmentStatus) =>
    s === "confirmed" ? { bg: "#dcfce7", color: "#15803d" }
    : s === "rejected" ? { bg: "#fee2e2", color: "#991b1b" }
    : { bg: "#fef9c3", color: "#854d0e" }

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Enrollment data for AY 2025–2026 · 1st Semester</p>
        </div>

        {/* Export buttons */}
        {!loading && !error && rows.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 mr-1">Export filtered ({filtered.length}):</span>
            <button
              onClick={() => exportCSV(filtered)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 transition-colors"
              style={{ border: "1px solid #e5e7eb", color: "#374151" }}
            >
              CSV
            </button>
            <button
              onClick={() => exportExcel(filtered)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 transition-colors"
              style={{ border: "1px solid #e5e7eb", color: "#374151" }}
            >
              Excel
            </button>
            <button
              onClick={() => exportPDF(filtered)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: "#7a1515", border: "1px solid #7a1515" }}
            >
              PDF / Print
            </button>
          </div>
        )}
      </div>

      {/* ── Loading / error ── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white animate-pulse" style={{ border: "1px solid #e5e7eb" }} />
          ))}
        </div>
      )}
      {!loading && error && (
        <div className="rounded-2xl px-6 py-5 text-sm" style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#991b1b" }}>
          {error}
          <button onClick={() => void load()} className="ml-3 underline font-semibold">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Summary stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Stat label="Total"     value={rows.length} accent />
            <Stat label="Regular"   value={regular}   />
            <Stat label="Irregular" value={irregular} />
            <Stat label="Confirmed" value={confirmed} />
            <Stat label="Pending"   value={pending}   />
          </div>

          {/* ── Daily / weekly totals ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white px-6 py-5" style={{ border: "1px solid #e5e7eb" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Today&apos;s Enrollees</p>
              <p className="text-[40px] font-semibold leading-none text-gray-900">{todayRows.length}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString("en-PH",{ weekday:"long", month:"long", day:"numeric" })}</p>
            </div>
            <div className="rounded-2xl bg-white px-6 py-5" style={{ border: "1px solid #e5e7eb" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">This Week&apos;s Enrollees</p>
              <p className="text-[40px] font-semibold leading-none text-gray-900">{weekRows.length}</p>
              <p className="text-xs text-gray-400 mt-1">
                {startOfWeek(new Date()).toLocaleDateString("en-PH",{ month:"short", day:"numeric" })}
                {" – "}
                {new Date(startOfWeek(new Date()).setDate(startOfWeek(new Date()).getDate()+6)).toLocaleDateString("en-PH",{ month:"short", day:"numeric" })}
              </p>
            </div>
          </div>

          {/* ── Category breakdown ── */}
          <div className="rounded-2xl bg-white px-6 py-5" style={{ border: "1px solid #e5e7eb" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-4">Breakdown by Category</p>
            <div className="space-y-3">
              {(
                [
                  { label: "Regular — Confirmed",   count: rows.filter(r => r.student_type === "regular"   && r.status === "confirmed").length },
                  { label: "Regular — Pending",      count: rows.filter(r => r.student_type === "regular"   && r.status === "pending").length },
                  { label: "Regular — Rejected",     count: rows.filter(r => r.student_type === "regular"   && r.status === "rejected").length },
                  { label: "Irregular — Confirmed",  count: rows.filter(r => r.student_type === "irregular" && r.status === "confirmed").length },
                  { label: "Irregular — Pending",    count: rows.filter(r => r.student_type === "irregular" && r.status === "pending").length },
                  { label: "Irregular — Rejected",   count: rows.filter(r => r.student_type === "irregular" && r.status === "rejected").length },
                ] as { label: string; count: number }[]
              ).filter(b => b.count > 0).map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-52 shrink-0">{b.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rows.length ? Math.round((b.count / rows.length) * 100) : 0}%`,
                        background: "#7a1515",
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-6 text-right">{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Type:</span>
            <Pill value="all"       current={typeFilter} onSelect={setTypeFilter} label="All" />
            <Pill value="regular"   current={typeFilter} onSelect={setTypeFilter} label="Regular" />
            <Pill value="irregular" current={typeFilter} onSelect={setTypeFilter} label="Irregular" />
            <span className="ml-4 text-xs text-gray-400 font-medium">Status:</span>
            <Pill value="all"       current={statusFilter} onSelect={setStatusFilter} label="All" />
            <Pill value="confirmed" current={statusFilter} onSelect={setStatusFilter} label="Confirmed" />
            <Pill value="pending"   current={statusFilter} onSelect={setStatusFilter} label="Pending" />
            <Pill value="rejected"  current={statusFilter} onSelect={setStatusFilter} label="Rejected" />
          </div>

          {/* ── Table ── */}
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <p className="text-sm font-semibold text-gray-900">
                Enrolled Students
                <span className="ml-2 text-xs font-normal text-gray-400">({filtered.length} record{filtered.length !== 1 ? "s" : ""})</span>
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">No records match the selected filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                      {["ENR Number","Full Name","Student ID","Type","Year Level","Program","Status","Date Enrolled"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(r => {
                      const sc = statusColor(r.status)
                      return (
                        <tr key={r.enr_number} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.enr_number}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.full_name}</td>
                          <td className="px-4 py-3 text-gray-500">{r.student_id}</td>
                          <td className="px-4 py-3 capitalize text-gray-600">{r.student_type}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.year_level}</td>
                          <td className="px-4 py-3 text-gray-600">{r.program}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize"
                              style={{ background: sc.bg, color: sc.color }}>
                              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: sc.color }} />
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
