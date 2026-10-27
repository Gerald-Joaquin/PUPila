"use client"

import { useEffect, useState } from "react"
import type { Enrollment, EnrollmentStatus } from "@/types"
import { generateEnrollmentFormHTML } from "@/lib/utils"

interface Props {
  enrNumber: string
  open: boolean
  onClose: () => void
}

// ── Status step definitions ─────────────────────────────────────────────────
const STEPS_PENDING   = ["Submitted", "Under Review", "Awaiting Approval"]
const STEPS_CONFIRMED = ["Submitted", "Under Review", "Approved", "Enrolled"]
const STEPS_REJECTED  = ["Submitted", "Under Review", "Rejected"]

function stepIndexFor(status: EnrollmentStatus) {
  if (status === "confirmed") return STEPS_CONFIRMED.length - 1
  if (status === "rejected")  return STEPS_REJECTED.length  - 1
  return 1 // pending = Under Review
}

function getSteps(status: EnrollmentStatus) {
  if (status === "confirmed") return STEPS_CONFIRMED
  if (status === "rejected")  return STEPS_REJECTED
  return STEPS_PENDING
}

// ── Inline status badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const cfg = {
    confirmed: { bg: "#dcfce7", color: "#15803d", label: "Confirmed" },
    pending:   { bg: "#fef9c3", color: "#854d0e", label: "Pending"   },
    rejected:  { bg: "#fee2e2", color: "#991b1b", label: "Rejected"  },
  }[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

// ── Timeline step ───────────────────────────────────────────────────────────
function Step({
  label, index, activeIndex, total, status,
}: {
  label: string; index: number; activeIndex: number; total: number; status: EnrollmentStatus
}) {
  const isDone    = index < activeIndex
  const isActive  = index === activeIndex
  const isLast    = index === total - 1

  const accentColor =
    status === "rejected" && isActive ? "#991b1b" :
    status === "confirmed" && isActive ? "#15803d" :
    isActive ? "#9B1B1B" : undefined

  const circleBg =
    isDone    ? (status === "rejected" && isLast ? "#fee2e2" : "#fdf0f0") :
    isActive  ? (status === "rejected" ? "#fee2e2" : status === "confirmed" ? "#dcfce7" : "#fef9c3") :
    "#f3f4f6"

  const circleColor =
    isDone    ? "#9B1B1B" :
    isActive  ? (accentColor ?? "#9B1B1B") :
    "#9ca3af"

  return (
    <div className="flex items-start gap-3">
      {/* Line + circle */}
      <div className="flex flex-col items-center" style={{ width: 28 }}>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all"
          style={{ background: circleBg, color: circleColor, border: `2px solid ${isActive || isDone ? circleColor : "#e5e7eb"}` }}
        >
          {isDone ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isActive && status === "rejected" ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
        {index < total - 1 && (
          <div className="w-0.5 mt-1" style={{ height: 28, background: isDone ? "#9B1B1B" : "#e5e7eb" }} />
        )}
      </div>

      {/* Label */}
      <div className="pb-1 pt-1">
        <p
          className="text-sm font-semibold leading-tight"
          style={{ color: isActive ? (accentColor ?? "#9B1B1B") : isDone ? "#374151" : "#9ca3af" }}
        >
          {label}
        </p>
        {isActive && (
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
            {status === "pending"   ? "Waiting for staff review…"         :
             status === "confirmed" ? "Your enrollment has been approved." :
                                     "Contact the Enrollment Office."}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main modal ──────────────────────────────────────────────────────────────
export function TrackStatusModal({ enrNumber, open, onClose }: Props) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    if (!open || !enrNumber) return
    setLoading(true)
    setError(null)
    setEnrollment(null)
    fetch(`/api/enrollments/${encodeURIComponent(enrNumber)}`)
      .then(r => r.ok ? r.json() : r.json().then((d: { error?: string }) => Promise.reject(d.error ?? "Not found")))
      .then((data: Enrollment) => setEnrollment(data))
      .catch((msg: string) => setError(msg))
      .finally(() => setLoading(false))
  }, [open, enrNumber])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  const status = enrollment?.status
  const steps  = status ? getSteps(status) : STEPS_PENDING
  const active = status ? stepIndexFor(status) : 1

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Card */}
      <div
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: "1px solid #e5e7eb" }}
      >
        {/* Top accent bar */}
        <div className="h-1.5" style={{ background: "linear-gradient(90deg,#9B1B1B,#F5B400)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h2 className="text-base font-bold text-gray-900">Enrollment Status</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{enrNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + i * 15}%` }} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl p-4 text-sm" style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#991b1b" }}>
              <p className="font-semibold">Enrollment not found</p>
              <p className="text-xs mt-1 text-red-700">{error}</p>
            </div>
          )}

          {/* Enrollment summary */}
          {!loading && enrollment && (
            <>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{enrollment.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{enrollment.program} · {enrollment.year_level} · {enrollment.semester}</p>
                </div>
                <StatusBadge status={enrollment.status} />
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                {steps.map((label, i) => (
                  <Step
                    key={label}
                    label={label}
                    index={i}
                    activeIndex={active}
                    total={steps.length}
                    status={enrollment.status}
                  />
                ))}
              </div>

              {/* Subject list */}
              {enrollment.subjects.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
                  <div className="px-4 py-2.5" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subjects</p>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {enrollment.subjects.map(s => (
                      <li key={s.code} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                        <span className="font-mono text-xs w-14 shrink-0" style={{ color: "#9B1B1B" }}>{s.code}</span>
                        <span className="flex-1 text-gray-800">{s.name}</span>
                        <span className="text-xs text-gray-400">{s.units} units</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex flex-col gap-2">
          {/* Download form — only when confirmed */}
          {enrollment?.status === "confirmed" && (
            <button
              onClick={() => {
                const win = window.open("", "_blank")
                if (!win || !enrollment) return
                win.document.write(generateEnrollmentFormHTML(enrollment))
                win.document.close()
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#9B1B1B,#7a1515)" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a4 4 0 004 4h10a4 4 0 004-4v-1"/>
              </svg>
              Download Approved Form
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ border: "1px solid #e5e7eb" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
