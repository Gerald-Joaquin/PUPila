"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import type { Enrollment, EnrollmentSummary } from "@/types"
import { useRole } from "@/components/RoleToggle"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { generateEnrollmentFormHTML } from "@/lib/utils"

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabaseBrowser.auth.getSession()
  return {
    "x-demo-role": "staff",
    ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

function openFormWindow(e: Enrollment) {
  const win = window.open("", "_blank")
  if (!win) return
  win.document.write(generateEnrollmentFormHTML(e))
  win.document.close()
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "confirmed" ? "bg-[#e7f5ee] text-pupila-green" :
    status === "rejected"  ? "bg-pupila-tint text-pupila-brand" :
                             "bg-pupila-soft text-pupila-mute"
  return (
    <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap ${cls}`}>
      {status === "confirmed" ? "Confirmed" : status === "rejected" ? "Rejected" : "Pending"}
    </span>
  )
}

// ── Enrollment form card (read-only display inside the panel) ──────────────

function EnrollmentFormCard({ e }: { e: Enrollment }) {
  const statusColor =
    e.status === "confirmed" ? "#15803d" :
    e.status === "rejected"  ? "#991b1b" :
                               "#854d0e"
  const statusLabel =
    e.status === "confirmed" ? "APPROVED" :
    e.status === "rejected"  ? "REJECTED" :
                               "PENDING APPROVAL"

  const totalUnits = e.subjects.reduce((sum, s) => sum + s.units, 0)

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: "1px solid #e8ddd8" }}>
      {/* Form header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3"
        style={{ background: "#7a1515", borderBottom: "1px solid #6a0f0f" }}>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-white/60 uppercase mb-0.5">PUPILA</p>
          <p className="text-[15px] font-bold text-white leading-tight">Student Enrollment Form</p>
          <p className="text-[11px] font-mono text-white/70 mt-1">{e.enr_number}</p>
        </div>
        <span
          className="shrink-0 text-[11px] font-extrabold tracking-[0.1em] px-3 py-1.5 rounded-md mt-0.5"
          style={{ border: `2px solid ${statusColor === "#15803d" ? "#fff" : "#fff"}`, color: "#fff", background: "rgba(255,255,255,0.15)" }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Student info grid */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3" style={{ background: "#fdfcfb", borderBottom: "1px solid #f0e8e4" }}>
        <div className="col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Full Name</p>
          <p className="text-[14px] font-semibold text-gray-900">{e.full_name}</p>
        </div>
        {[
          { label: "Student ID",    value: e.student_id },
          { label: "Student Type",  value: e.student_type.charAt(0).toUpperCase() + e.student_type.slice(1) },
          { label: "Year Level",    value: e.year_level },
          { label: "Program",       value: e.program },
          { label: "Semester",      value: e.semester },
          { label: "Academic Year", value: e.academic_year },
        ].map(f => (
          <div key={f.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{f.label}</p>
            <p className="text-[13px] font-medium text-gray-800">{f.value}</p>
          </div>
        ))}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Status</p>
          <p className="text-[13px] font-bold" style={{ color: statusColor }}>{statusLabel}</p>
        </div>
      </div>

      {/* Subjects table */}
      <div style={{ background: "#fff" }}>
        <div className="px-5 py-2.5" style={{ borderBottom: "1px solid #f0e8e4", background: "#f9f5f3" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Enrolled Subjects</p>
        </div>
        {e.subjects.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f3eeec" }}>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-8">#</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-20">Code</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Subject Name</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-16">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#f0e8e4" }}>
              {e.subjects.map((s, i) => (
                <tr key={s.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400 text-center">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{s.code}</td>
                  <td className="px-4 py-2.5 text-gray-800">{s.name}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{s.units}</td>
                </tr>
              ))}
              <tr style={{ background: "#f9f5f3" }}>
                <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-bold text-gray-700">Total Units</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold" style={{ color: "#7a1515" }}>{totalUnits}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-4 text-sm text-gray-400">No subjects on record.</p>
        )}
      </div>

      {/* Signature line strip */}
      <div className="px-5 py-4 grid grid-cols-3 gap-4" style={{ background: "#f9f5f3", borderTop: "1px solid #f0e8e4" }}>
        {["Student Signature", "Registrar / Dept. Head", "Noted by"].map(lbl => (
          <div key={lbl} className="text-center">
            <div className="border-b border-gray-400 mb-1 h-5" />
            <p className="text-[10px] font-medium text-gray-400">{lbl}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Date: ________</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────

interface DetailPanelProps {
  enrNumber: string
  onRefresh: () => void
}

type ActionState = "idle" | "confirming" | "rejecting" | "done-confirmed" | "done-rejected" | "error"

function DetailPanel({ enrNumber, onRefresh }: DetailPanelProps) {
  const [detail,    setDetail]    = useState<Enrollment | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [fetchErr,  setFetchErr]  = useState<string | null>(null)
  const [action,    setAction]    = useState<ActionState>("idle")
  const [actionErr, setActionErr] = useState<string | null>(null)

  useEffect(() => {
    setDetail(null); setLoading(true); setFetchErr(null)
    setAction("idle"); setActionErr(null)
    authHeaders().then(headers =>
      fetch(`/api/enrollments/${encodeURIComponent(enrNumber)}`, { headers })
        .then(r => { if (!r.ok) throw new Error("Failed to load"); return r.json() })
        .then((d: Enrollment) => { setDetail(d); setLoading(false) })
        .catch(e => { setFetchErr(e instanceof Error ? e.message : "Error"); setLoading(false) })
    )
  }, [enrNumber])

  async function handleAction(status: "confirmed" | "rejected") {
    if (action === "confirming" || action === "rejecting") return
    setActionErr(null)
    setAction(status === "confirmed" ? "confirming" : "rejecting")
    try {
      const res = await fetch(`/api/enrollments/${encodeURIComponent(enrNumber)}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body:    JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to update status")
      }
      setAction(status === "confirmed" ? "done-confirmed" : "done-rejected")
      setDetail(prev => prev ? { ...prev, status } : prev)
      onRefresh()
    } catch (e: unknown) {
      setActionErr(e instanceof Error ? e.message : "Unknown error")
      setAction("idle")
    }
  }

  if (loading) {
    return (
      <div className="bg-pupila-card border border-pupila-line rounded-[14px] p-6 space-y-3 animate-pulse">
        <div className="h-5 bg-pupila-soft rounded w-1/2" />
        <div className="h-4 bg-pupila-soft rounded w-1/3" />
        <div className="h-48 bg-pupila-soft rounded mt-4" />
      </div>
    )
  }

  if (fetchErr || !detail) {
    return (
      <div className="bg-pupila-card border border-pupila-line rounded-[14px] p-6 text-center">
        <p className="text-pupila-brand text-sm">{fetchErr ?? "Not found"}</p>
      </div>
    )
  }

  const isPending = detail.status === "pending"
  const isBusy    = action === "confirming" || action === "rejecting"

  return (
    <div className="space-y-4">

      {/* Action bar — approve/reject for pending, download for all */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Download form button — always available */}
        <button
          onClick={() => openFormWindow(detail)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
          style={{ background: "#7a1515", color: "#fff", border: "1px solid #7a1515" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a4 4 0 004 4h10a4 4 0 004-4v-1"/>
          </svg>
          Download Form
        </button>

        {/* Approve / Reject — only for pending */}
        {isPending && action !== "done-confirmed" && action !== "done-rejected" && (
          <>
            <button
              onClick={() => handleAction("confirmed")}
              disabled={isBusy}
              data-testid="confirm-btn"
              className="text-sm font-semibold border rounded-[10px] px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#F5B400", borderColor: "#F5B400", color: "#2b1716" }}
            >
              {action === "confirming" ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => handleAction("rejected")}
              disabled={isBusy}
              data-testid="reject-btn"
              className="text-sm font-semibold border border-pupila-line bg-pupila-card hover:bg-pupila-soft rounded-[10px] px-4 py-2 text-pupila-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action === "rejecting" ? "Rejecting…" : "Reject"}
            </button>
          </>
        )}
      </div>

      {/* Inline action feedback */}
      {(action === "done-confirmed" || action === "done-rejected") && (
        <div
          className="rounded-[10px] px-4 py-3 text-sm font-medium"
          data-testid="action-success"
          style={{
            background: action === "done-confirmed" ? "#e7f5ee" : "#fdf0f0",
            color:      action === "done-confirmed" ? "#15803d" : "#991b1b",
            border:     `1px solid ${action === "done-confirmed" ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {action === "done-confirmed"
            ? "✓ Enrollment approved. The student can now download their approved form."
            : "✗ Enrollment rejected."}
        </div>
      )}

      {actionErr && (
        <p className="text-pupila-brand text-sm" data-testid="action-error">{actionErr}</p>
      )}

      {/* The form itself */}
      <EnrollmentFormCard e={detail} />
    </div>
  )
}

// ── Requests page ──────────────────────────────────────────────────────────

export default function RequestsPage() {
  const { isStaff }                       = useRole()
  const [enrollments,   setEnrollments]   = useState<EnrollmentSummary[]>([])
  const [initialLoad,   setInitialLoad]   = useState(true)
  const [backgrounding, setBackgrounding] = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [selected,      setSelected]      = useState<string | null>(null)

  const load = useCallback(async (background = false) => {
    if (!isStaff) { setInitialLoad(false); return }
    background ? setBackgrounding(true) : setInitialLoad(true)
    setError(null)
    try {
      const res = await fetch("/api/enrollments", { headers: await authHeaders() })
      if (!res.ok) throw new Error("Failed to load enrollments")
      const json = await res.json()
      const arr: EnrollmentSummary[] = Array.isArray(json) ? json : []
      setEnrollments(arr)
      setSelected(prev => {
        if (prev && arr.some(e => e.enr_number === prev)) return prev
        return arr[0]?.enr_number ?? null
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setInitialLoad(false)
      setBackgrounding(false)
    }
  }, [isStaff])

  useEffect(() => { void load(false) }, [load])

  if (!isStaff) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="text-pupila-ink font-semibold">Staff access required</p>
        <p className="text-sm text-pupila-mute">Use the role toggle in the header to switch to Admin View.</p>
        <Link href="/" className="inline-block mt-2 text-sm text-pupila-brand hover:underline">
          ← Back to student portal
        </Link>
      </div>
    )
  }

  return (
    <div>
      <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-pupila-brand mb-1.5 uppercase">
        Enrollment Requests
      </p>
      <h1 className="text-[clamp(24px,2.5vw,30px)] font-semibold tracking-[-0.025em] leading-[1.15] text-pupila-ink mb-1.5">
        Requests
      </h1>
      <p className="text-sm text-pupila-mute mb-6">
        Review enrollment applications. Approve or reject pending requests, and download any form.
      </p>

      {initialLoad ? (
        <div className="text-center py-16 text-pupila-mute">Loading…</div>
      ) : error ? (
        <div className="bg-pupila-card border border-pupila-line rounded-[14px] px-6 py-8 text-center">
          <p className="text-pupila-brand text-sm mb-3">{error}</p>
          <button
            onClick={() => void load(false)}
            className="text-sm text-pupila-brand border border-pupila-line rounded-[10px] px-4 py-2 hover:bg-pupila-soft transition-colors"
          >
            Retry
          </button>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-pupila-card border border-pupila-line rounded-[14px] px-6 py-16 text-center">
          <p className="text-sm text-pupila-mute">No enrollments yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] gap-5 items-start">

          {/* Left: list */}
          <div>
            {backgrounding && (
              <p className="text-xs text-pupila-mute mb-2 text-right">Refreshing…</p>
            )}
            {enrollments.map(e => (
              <button
                key={e.enr_number}
                onClick={() => setSelected(e.enr_number)}
                data-testid={`list-item-${e.enr_number}`}
                className={[
                  "block w-full text-left border rounded-[14px] px-4 py-[14px] mb-2.5 cursor-pointer transition-colors",
                  selected === e.enr_number
                    ? "border-pupila-brand bg-pupila-tint"
                    : "border-pupila-line bg-pupila-card hover:bg-pupila-soft",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[15px] text-pupila-ink truncate">{e.full_name}</span>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-[12px] text-pupila-mute mt-0.5 font-mono">{e.enr_number}</p>
                <p className="text-[12px] text-pupila-mute capitalize">{e.student_type} · {e.year_level} · {e.program}</p>
              </button>
            ))}
          </div>

          {/* Right: detail + form */}
          <div className="lg:sticky lg:top-[80px]">
            {selected ? (
              <DetailPanel key={selected} enrNumber={selected} onRefresh={() => void load(true)} />
            ) : (
              <div className="bg-pupila-card border border-pupila-line rounded-[14px] px-6 py-16 text-center">
                <p className="text-sm text-pupila-mute">Select a request to review.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
