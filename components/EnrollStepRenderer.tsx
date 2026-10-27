"use client"

import type { EnrollContext, StudentType } from "@/types"

interface EnrollStepRendererProps {
  ctx:             EnrollContext
  onSelect:        (value: string) => void
  onSubjectChange: (codes: string[]) => void
  onConfirm:       () => void
  onCancel:        () => void
}

// ── Shared button styles ──────────────────────────────────────────────
const primaryBtn =
  "w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-[#9B1B1B] text-white hover:bg-[#7a1515] active:scale-[0.98] transition-all disabled:opacity-40"

const optionBtn = (active: boolean) =>
  `flex-1 px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all active:scale-[0.98] ${
    active
      ? "border-[#9B1B1B] bg-[#9B1B1B]/8 text-[#9B1B1B] shadow-sm"
      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
  }`

// ── Step: confirm_identity ────────────────────────────────────────────
function ConfirmIdentity({
  ctx,
  onSelect,
  onCancel,
}: Pick<EnrollStepRendererProps, "ctx" | "onSelect" | "onCancel">) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700">
        I found your account. Just to confirm — is this you?
      </p>
      <div className="bg-[#f8f5f3] border border-[#eadfd8] rounded-xl px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Full Name</span>
          <span className="text-[13px] text-gray-900 font-medium">
            {ctx.full_name || <span className="text-gray-400 italic">Not found</span>}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Student ID</span>
          <span className="text-[13px] text-gray-900 font-mono">
            {ctx.student_id || <span className="text-gray-400 italic">Not found</span>}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className={primaryBtn}
          onClick={() => onSelect("confirmed")}
        >
          Yes, that&apos;s me →
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all whitespace-nowrap"
        >
          Use different account
        </button>
      </div>
    </div>
  )
}

// ── Step: student_type ────────────────────────────────────────────────
function StudentTypeStep({ ctx, onSelect }: Pick<EnrollStepRendererProps, "ctx" | "onSelect">) {
  const current = ctx.student_type
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700">Are you enrolling as a <strong>Regular</strong> or <strong>Irregular</strong> student?</p>
      <div className="flex gap-2">
        <button className={optionBtn(current === "regular")} onClick={() => onSelect("regular")}>
          <span className="block text-left">
            <span className="block font-semibold">Regular</span>
            <span className="block text-[11px] text-gray-500 font-normal mt-0.5">Auto-assigned subjects</span>
          </span>
        </button>
        <button className={optionBtn(current === "irregular")} onClick={() => onSelect("irregular")}>
          <span className="block text-left">
            <span className="block font-semibold">Irregular</span>
            <span className="block text-[11px] text-gray-500 font-normal mt-0.5">Pick your own subjects</span>
          </span>
        </button>
      </div>
    </div>
  )
}

// ── Step: year_level ──────────────────────────────────────────────────
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

function YearLevelStep({ ctx, onSelect }: Pick<EnrollStepRendererProps, "ctx" | "onSelect">) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700">What year level are you enrolling for?</p>
      <div className="grid grid-cols-2 gap-2">
        {YEAR_LEVELS.map(yr => (
          <button
            key={yr}
            className={optionBtn(ctx.year_level === yr)}
            onClick={() => onSelect(yr)}
          >
            {yr}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step: program ─────────────────────────────────────────────────────
const PROGRAMS = ["BSIT", "BSCPE", "BSCS"]

function ProgramStep({ ctx, onSelect }: Pick<EnrollStepRendererProps, "ctx" | "onSelect">) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700">Which program are you enrolled in?</p>
      <div className="flex gap-2">
        {PROGRAMS.map(p => (
          <button
            key={p}
            className={optionBtn(ctx.program === p)}
            onClick={() => onSelect(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step: review ──────────────────────────────────────────────────────
function ReviewStep({
  ctx,
  onConfirm,
  onCancel,
}: Pick<EnrollStepRendererProps, "ctx" | "onConfirm" | "onCancel">) {
  const typeLabel: Record<StudentType, string> = {
    regular:   "Regular",
    irregular: "Irregular",
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700">Here&apos;s your enrollment summary — ready to submit?</p>

      <div className="bg-[#f8f5f3] border border-[#eadfd8] rounded-xl px-4 py-3 space-y-2">
        <Row label="Name"         value={ctx.full_name} />
        <Row label="Student ID"   value={ctx.student_id} />
        <Row label="Type"         value={ctx.student_type ? typeLabel[ctx.student_type] : "—"} />
        <Row label="Year Level" value={ctx.year_level ?? "—"} />
        <Row label="Program"    value={ctx.program ?? "—"} />
        {ctx.student_type === "irregular" ? (
          <Row label="Subjects" value={`Auto-assigned from ${ctx.year_level} + year below`} muted />
        ) : (
          <Row label="Subjects" value="Auto-assigned by curriculum" muted />
        )}
      </div>

      {ctx.error && (
        <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {ctx.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          className={primaryBtn}
          onClick={onConfirm}
          disabled={ctx.submitting}
        >
          {ctx.submitting ? "Submitting…" : "Confirm Enrollment ✓"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all whitespace-nowrap"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
      <span className={`text-[13px] ${muted ? "text-gray-400 italic" : "text-gray-900"} font-medium`}>{value}</span>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────
export function EnrollStepRenderer({
  ctx,
  onSelect,
  onSubjectChange: _onSubjectChange,
  onConfirm,
  onCancel,
}: EnrollStepRendererProps) {
  if (!ctx.active) return null

  switch (ctx.step) {
    case "confirm_identity":
      return <ConfirmIdentity ctx={ctx} onSelect={onSelect} onCancel={onCancel} />
    case "student_type":
      return <StudentTypeStep ctx={ctx} onSelect={onSelect} />
    case "year_level":
      return <YearLevelStep ctx={ctx} onSelect={onSelect} />
    case "program":
      return <ProgramStep ctx={ctx} onSelect={onSelect} />
    case "review":
      return <ReviewStep ctx={ctx} onConfirm={onConfirm} onCancel={onCancel} />
    default:
      return null
  }
}
