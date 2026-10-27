"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { EnrollmentNumberReveal } from "@/components/EnrollmentNumberReveal"
import { TrackStatusModal } from "@/components/TrackStatusModal"
import type { Enrollment } from "@/types"

function SuccessContent() {
  const params     = useSearchParams()
  const enrNumber  = params.get("enr") ?? ""
  const status     = params.get("status") ?? ""
  const [enrollment,   setEnrollment]   = useState<Enrollment | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [trackOpen,    setTrackOpen]    = useState(false)

  useEffect(() => {
    if (!enrNumber) { setLoading(false); return }
    fetch(`/api/enrollments/${encodeURIComponent(enrNumber)}`)
      .then(r => {
        if (!r.ok) return null
        return r.json()
      })
      .then(data => { if (data) setEnrollment(data) })
      .finally(() => setLoading(false))
  }, [enrNumber])

  if (!enrNumber) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No enrollment number found.</p>
        <Link href="/user/enroll" className="text-indigo-600 underline mt-2 inline-block">Start enrollment</Link>
      </div>
    )
  }

  const isConfirmed = status === "confirmed"

  return (
    <div className="max-w-lg mx-auto text-center space-y-8 py-8">
      <div className="space-y-3">
        <div className="text-5xl">{isConfirmed ? "✅" : "⏳"}</div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          {isConfirmed ? "You're enrolled!" : "Pending Approval"}
        </h1>
        <p className="text-gray-500 text-sm">
          {isConfirmed
            ? "Your enrollment has been confirmed. Your subjects have been auto-assigned."
            : "Your enrollment has been submitted and is awaiting staff approval."}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Your ENR Number</p>
        <EnrollmentNumberReveal enrNumber={enrNumber} />
        <p className="text-xs text-gray-400">Save this number — you&apos;ll need it to track your status.</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Loading subjects…</div>
      ) : enrollment?.subjects && enrollment.subjects.length > 0 ? (
        <div className="text-left border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {isConfirmed ? "Auto-assigned Subjects" : "Selected Subjects"}
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {enrollment.subjects.map(s => (
              <li key={s.code} className="px-4 py-3 flex items-center gap-3 text-sm">
                <span className="font-mono text-indigo-500 w-16 shrink-0">{s.code}</span>
                <span className="flex-1 text-gray-800">{s.name}</span>
                <span className="text-gray-400 text-xs">{s.units} units</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <TrackStatusModal enrNumber={enrNumber} open={trackOpen} onClose={() => setTrackOpen(false)} />

      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => setTrackOpen(true)}
          className="text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          style={{ background: "linear-gradient(135deg,#9B1B1B,#A31F1F)" }}
        >
          Track Status
        </button>
        <Link
          href={`/user/track?enr=${encodeURIComponent(enrNumber)}`}
          className="text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          style={{ background: "linear-gradient(135deg,#8B1A1A,#A31F1F)" }}
        >
          View my schedule
        </Link>
        <Link
          href="/user/enroll"
          className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
        >
          New Enrollment
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  )
}
