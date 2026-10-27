"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { Subject } from "@/types"
import { SubjectPicker } from "@/components/SubjectPicker"
import { supabaseBrowser } from "@/lib/supabase-browser"

type StudentType = "regular" | "irregular"
type YearLevel   = "1st Year" | "2nd Year" | "3rd Year" | "4th Year"
type Program     = "BSIT" | "BSCPE" | "BSCS"

interface FormState {
  full_name:    string
  student_id:   string
  student_type: StudentType
  year_level:   YearLevel
  program:      string
}

const YEAR_LEVELS: YearLevel[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
const PROGRAMS:    Program[]   = ["BSIT", "BSCPE", "BSCS"]

export default function EnrollPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-gray-500">Loading enrollment form…</div>}>
      <EnrollForm />
    </Suspense>
  )
}

function EnrollForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const typeParam    = searchParams.get("type")
  const initialType: StudentType =
    typeParam === "irregular" ? "irregular" : "regular"

  const [form, setForm] = useState<FormState>({
    full_name:    "",
    student_id:   "",
    student_type: initialType,
    year_level:   "1st Year",
    program:      "BSIT" as Program,
  })
  const [subjectCodes,    setSubjectCodes]    = useState<string[]>([])
  const [subjects,        setSubjects]        = useState<Subject[]>([])
  const [errors,          setErrors]          = useState<Record<string, string>>({})
  const [loading,         setLoading]         = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [subjectsError,   setSubjectsError]   = useState<string | null>(null)

  // Load subjects when switching to irregular (or when program changes while irregular)
  useEffect(() => {
    if (form.student_type !== "irregular") return
    setSubjectsLoading(true)
    setSubjectsError(null)
    setSubjectCodes([])
    fetch(`/api/subjects?program=${encodeURIComponent(form.program)}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to load subjects")
        return r.json()
      })
      .then(data => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjectsError("Could not load subjects. Please refresh and try again."))
      .finally(() => setSubjectsLoading(false))
  }, [form.student_type, form.program])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.full_name.trim())   e.full_name  = "Full name is required"
    if (!form.student_id.trim())  e.student_id = "Student ID is required"
    if (form.student_type === "irregular" && subjectCodes.length === 0)
      e.subject_codes = "Select at least one subject"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const body: Record<string, unknown> = { ...form }
      if (form.student_type === "irregular") body.subject_codes = subjectCodes

      const { data: { session } } = await supabaseBrowser.auth.getSession()
      const res = await fetch("/api/enrollments", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ form: data.error ?? "Enrollment failed. Please try again." })
        return
      }
      router.push(`/user/success?enr=${encodeURIComponent(data.enr_number)}&status=${data.status}`)
    } catch {
      setErrors({ form: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const inputBase = "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400"
  const inputNormal = `${inputBase} border-gray-200 bg-white focus:border-[#9B1B1B]/50 focus:ring-2 focus:ring-[#9B1B1B]/10`
  const inputError  = `${inputBase} border-red-400 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100`

  return (
    <div className="min-h-full py-8 px-6 flex flex-col items-center">
      {/* Back link */}
      <div className="w-full max-w-lg mb-4">
        <Link
          href="/user"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#9B1B1B] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to home
        </Link>
      </div>

      {/* Form card */}
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-7 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9B1B1B]/8 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[#9B1B1B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Enrollment Form</h1>
              <p className="text-xs text-gray-500 mt-0.5">{form.program} · AY 2025–2026 · 1st Semester</p>
            </div>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={submit} className="px-7 py-6 space-y-5">
          {/* Full name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Full Name
            </label>
            <input
              className={errors.full_name ? inputError : inputNormal}
              placeholder="e.g. Sam Torres"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
            {errors.full_name && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Student ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Student ID
            </label>
            <input
              className={errors.student_id ? inputError : inputNormal}
              placeholder="e.g. 2024-01092"
              value={form.student_id}
              onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
            />
            {errors.student_id && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {errors.student_id}
              </p>
            )}
          </div>

          {/* Year level + Program row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Year Level
              </label>
              <select
                className={`${inputNormal} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]`}
                value={form.year_level}
                onChange={e => setForm(f => ({ ...f, year_level: e.target.value as YearLevel }))}
              >
                {YEAR_LEVELS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Program
              </label>
              <select
                className={inputNormal}
                value={form.program}
                onChange={e => setForm(f => ({ ...f, program: e.target.value as Program }))}
              >
                {PROGRAMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Student type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Student Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["regular", "irregular"] as StudentType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, student_type: type })); setSubjectCodes([]) }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.student_type === type
                      ? "border-[#9B1B1B] bg-[#9B1B1B]/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`font-bold text-sm capitalize mb-0.5 ${form.student_type === type ? "text-[#9B1B1B]" : "text-gray-800"}`}>
                    {type}
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    {type === "regular"
                      ? "Auto-assigned subjects, confirmed instantly"
                      : "Pick your subjects, pending staff approval"}
                  </div>
                  {form.student_type === type && (
                    <div className="mt-2 flex items-center gap-1 text-[#9B1B1B]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/>
                      </svg>
                      <span className="text-[11px] font-semibold">Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Subject picker — irregular only */}
          {form.student_type === "irregular" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Select Subjects
              </label>
              {subjectsLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Loading subjects…
                </div>
              ) : subjectsError ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{subjectsError}</p>
              ) : (
                <SubjectPicker
                  subjects={subjects}
                  selected={subjectCodes}
                  onChange={setSubjectCodes}
                  error={errors.subject_codes}
                />
              )}
            </div>
          )}

          {/* Form-level error */}
          {errors.form && (
            <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <p className="text-sm">{errors.form}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9B1B1B] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#7a1515] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm mt-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Submitting…
              </>
            ) : (
              <>
                Submit Enrollment
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
