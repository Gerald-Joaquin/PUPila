"use client"

import { useState } from "react"
import type { Enrollment, Subject } from "@/types"
import { useRole } from "./RoleToggle"

interface AdminTableProps {
  enrollments: Enrollment[]
  onStatusChange: () => void
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending:   "bg-yellow-100 text-yellow-700",
  rejected:  "bg-red-100 text-red-700",
}

export function AdminTable({ enrollments, onStatusChange }: AdminTableProps) {
  const [filter,          setFilter]          = useState<"all" | "pending">("pending")
  const [expanding,       setExpanding]       = useState<string | null>(null)
  const [actionLoading,   setActionLoading]   = useState<string | null>(null)
  const [subjectCache,    setSubjectCache]    = useState<Record<string, Subject[] | "loading" | "error">>({})

  const { isStaff } = useRole()

  const filtered = filter === "pending"
    ? enrollments.filter(e => e.status === "pending")
    : enrollments

  const pendingCount = enrollments.filter(e => e.status === "pending").length

  async function updateStatus(enrNumber: string, status: "confirmed" | "rejected") {
    setActionLoading(enrNumber)
    try {
      const res = await fetch(`/api/enrollments/${encodeURIComponent(enrNumber)}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-role":  "staff",
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? "Failed to update status. Please try again.")
        return
      }
      onStatusChange()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleExpand(enrNumber: string) {
    if (expanding === enrNumber) { setExpanding(null); return }
    setExpanding(enrNumber)
    if (subjectCache[enrNumber] !== undefined) return
    setSubjectCache(c => ({ ...c, [enrNumber]: "loading" }))
    try {
      const res = await fetch(`/api/enrollments/${encodeURIComponent(enrNumber)}`)
      if (!res.ok) { setSubjectCache(c => ({ ...c, [enrNumber]: "error" })); return }
      const data: Enrollment = await res.json()
      setSubjectCache(c => ({ ...c, [enrNumber]: data.subjects ?? [] }))
    } catch {
      setSubjectCache(c => ({ ...c, [enrNumber]: "error" }))
    }
  }

  if (!isStaff) {
    return (
      <div className="text-center py-16 text-gray-500">
        Switch to Staff View to access the admin dashboard.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="ml-2 bg-white text-indigo-600 text-xs font-bold rounded-full px-1.5 py-0.5">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Enrollments
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          {filter === "pending" ? "No pending enrollments. 🎉" : "No enrollments yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">ENR Number</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => (
                <>
                  <tr
                    key={e.enr_number}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleExpand(e.enr_number)}
                  >
                    <td className="px-4 py-3 font-mono text-indigo-600">{e.enr_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-[160px]">{e.full_name}</div>
                      <div className="text-gray-400 text-xs">{e.student_id}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{e.student_type}</td>
                    <td className="px-4 py-3">{e.year_level}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[e.status] ?? ""}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.status === "pending" && (
                        <div className="flex gap-2" onClick={ev => ev.stopPropagation()}>
                          <button
                            onClick={() => updateStatus(e.enr_number, "confirmed")}
                            disabled={!!actionLoading}
                            className="px-3 py-1 rounded-md bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === e.enr_number ? "…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => updateStatus(e.enr_number, "rejected")}
                            disabled={!!actionLoading}
                            className="px-3 py-1 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === e.enr_number ? "…" : "Reject"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expanding === e.enr_number && (
                    <tr key={`${e.enr_number}-expand`} className="bg-indigo-50">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Enrolled Subjects</p>
                        {subjectCache[e.enr_number] === "loading" ? (
                          <p className="text-sm text-gray-400">Loading subjects…</p>
                        ) : subjectCache[e.enr_number] === "error" ? (
                          <p className="text-sm text-red-400">Failed to load subjects.</p>
                        ) : Array.isArray(subjectCache[e.enr_number]) && (subjectCache[e.enr_number] as Subject[]).length > 0 ? (
                          <ul className="space-y-1">
                            {(subjectCache[e.enr_number] as Subject[]).map(s => (
                              <li key={s.code} className="text-sm text-gray-700 flex gap-2">
                                <span className="font-mono text-indigo-500 w-16 shrink-0">{s.code}</span>
                                <span>{s.name}</span>
                                <span className="text-gray-400 text-xs ml-auto">{s.units} units</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400">No subjects found.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
