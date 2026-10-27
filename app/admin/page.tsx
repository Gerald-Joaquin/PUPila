"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import type { EnrollmentSummary } from "@/types"
import { useRole } from "@/components/RoleToggle"
import { supabaseBrowser } from "@/lib/supabase-browser"

interface Counts {
  total:     number
  pending:   number
  confirmed: number
  rejected:  number
  regular:   number
  irregular: number
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label:   string
  value:   number
  sub?:    string
  accent?: boolean
}) {
  return (
    <div
      className="rounded-2xl px-6 py-5 min-w-0"
      style={{
        background:  "#ffffff",
        border:      accent ? "1px solid #7a1515" : "1px solid #e5e7eb",
      }}
    >
      <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-3">{label}</p>
      <p
        className="text-[36px] font-semibold tracking-tight leading-none mb-2"
        style={{ color: accent ? "#7a1515" : "#111827" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { isStaff }                          = useRole()
  const [enrollments, setEnrollments]        = useState<EnrollmentSummary[]>([])
  const [counts,      setCounts]             = useState<Counts | null>(null)
  const [loading,     setLoading]            = useState(true)
  const [error,       setError]              = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isStaff) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      const res = await fetch("/api/enrollments", {
        headers: {
          "x-demo-role":   "staff",
          ...(session?.access_token
            ? { "Authorization": `Bearer ${session.access_token}` }
            : {}),
        },
      })
      if (!res.ok) throw new Error("Failed to load enrollments")
      const data: EnrollmentSummary[] = await res.json()
      const arr = Array.isArray(data) ? data : []
      setEnrollments(arr)
      setCounts({
        total:     arr.length,
        pending:   arr.filter(e => e.status === "pending").length,
        confirmed: arr.filter(e => e.status === "confirmed").length,
        rejected:  arr.filter(e => e.status === "rejected").length,
        regular:   arr.filter(e => e.student_type === "regular").length,
        irregular: arr.filter(e => e.student_type === "irregular").length,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [isStaff])

  useEffect(() => { load() }, [load])

  if (!isStaff) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 px-8 py-14 text-center max-w-sm mx-auto mt-10">
        <p className="text-[15px] font-semibold text-gray-900 mb-1">Staff access required</p>
        <p className="text-sm text-gray-400 mb-6">
          Use the role toggle in the header to switch to Admin View.
        </p>
        <Link
          href="/user"
          className="text-sm font-medium text-[#7a1515] hover:underline"
        >
          Back to student portal
        </Link>
      </div>
    )
  }

  // Sort pending ascending (oldest first), show up to 3
  const pendingList = [...enrollments]
    .filter(e => e.status === "pending")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 3)

  return (
    <div>
      {/* Heading */}
      <h1 className="text-[26px] font-semibold tracking-tight text-gray-900 mb-1">
        Enrollment overview
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        1st Semester &nbsp;·&nbsp; AY 2025–2026
      </p>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-[120px] animate-pulse"
              style={{ background: "#e5e7eb" }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          className="rounded-2xl px-6 py-8 text-center mb-6"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          <p className="text-sm text-[#7a1515] mb-3">{error}</p>
          <button
            onClick={load}
            className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : counts ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total enrolled"   value={counts.total}     sub="All enrollments" />
          <StatCard label="Pending approval" value={counts.pending}   sub="Irregular requests" accent />
          <StatCard
            label="Regular"
            value={counts.regular}
            sub={counts.total ? `${Math.round(counts.regular / counts.total * 100)}% of total` : undefined}
          />
          <StatCard
            label="Irregular"
            value={counts.irregular}
            sub={counts.total ? `${Math.round(counts.irregular / counts.total * 100)}% of total` : undefined}
          />
        </div>
      ) : null}

      {/* Two-column: Needs review + Summary */}
      {!loading && !error && counts !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Needs review */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Needs review</h2>
                <p className="text-sm text-gray-400 mt-0.5">Oldest requests first</p>
              </div>
              <Link
                href="/admin/requests"
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                View all
              </Link>
            </div>

            {pendingList.length === 0 ? (
              <p className="text-sm text-gray-400 pt-2">All requests have been reviewed.</p>
            ) : (
              pendingList.map(e => (
                <div
                  key={e.enr_number}
                  className="flex items-center justify-between gap-4 py-3"
                  style={{ borderTop: "1px solid #f3f4f6" }}
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{e.full_name}</p>
                    <p className="text-[12px] text-gray-400 font-mono">{e.student_id}</p>
                  </div>
                  <Link
                    href="/admin/requests"
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Enrollment summary */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <h2 className="text-[16px] font-semibold text-gray-900 mb-1">Enrollment summary</h2>
            <p className="text-sm text-gray-400 mb-4">
              {counts.total} total enrollment{counts.total !== 1 ? "s" : ""} this semester
            </p>

            {[
              { label: "Confirmed", value: counts.confirmed },
              { label: "Pending",   value: counts.pending   },
              { label: "Rejected",  value: counts.rejected  },
            ].map(row => (
              <div
                key={row.label}
                className="flex items-center justify-between py-3"
                style={{ borderTop: "1px solid #f3f4f6" }}
              >
                <span className="text-sm text-gray-700">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
