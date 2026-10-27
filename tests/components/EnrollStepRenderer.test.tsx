/**
 * EnrollStepRenderer — step rendering tests
 */
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { EnrollStepRenderer } from "@/components/EnrollStepRenderer"
import type { EnrollContext } from "@/types"

// ── Base context factory ──────────────────────────────────────────────
function makeCtx(overrides: Partial<EnrollContext> = {}): EnrollContext {
  return {
    active:       true,
    step:         "confirm_identity",
    full_name:    "Alex Rivera",
    student_id:   "2024-10001",
    student_type: null,
    year_level:   null,
    program:      null,
    submitting:   false,
    error:        null,
    ...overrides,
  }
}

const noop = vi.fn()

// ── confirm_identity ──────────────────────────────────────────────────
describe("confirm_identity step", () => {
  it("renders the pre-filled full_name and student_id", () => {
    render(
      <EnrollStepRenderer
        ctx={makeCtx()}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument()
    expect(screen.getByText("2024-10001")).toBeInTheDocument()
  })

  it("calls onSelect with 'confirmed' when the confirm button is clicked", () => {
    const onSelect = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={makeCtx()}
        onSelect={onSelect}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /yes.*me/i }))
    expect(onSelect).toHaveBeenCalledWith("confirmed")
  })

  it("calls onCancel when 'Use different account' is clicked", () => {
    const onCancel = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={makeCtx()}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /use different account/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})

// ── student_type ──────────────────────────────────────────────────────
describe("student_type step", () => {
  it("renders Regular and Irregular buttons", () => {
    render(
      <EnrollStepRenderer
        ctx={makeCtx({ step: "student_type" })}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    // Use getAllByRole to handle the paragraph text also matching "Regular"/"Irregular"
    const buttons = screen.getAllByRole("button")
    const labels = buttons.map(b => b.textContent)
    expect(labels.some(l => l?.includes("Regular"))).toBe(true)
    expect(labels.some(l => l?.includes("Irregular"))).toBe(true)
  })

  it("calls onSelect with 'regular' when Regular is clicked", () => {
    const onSelect = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={makeCtx({ step: "student_type" })}
        onSelect={onSelect}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    // Click the first button (Regular) — exact text match on the span child
    const buttons = screen.getAllByRole("button")
    const regularBtn = buttons.find(b => b.querySelector("span > span")?.textContent === "Regular")!
    fireEvent.click(regularBtn)
    expect(onSelect).toHaveBeenCalledWith("regular")
  })

  it("calls onSelect with 'irregular' when Irregular is clicked", () => {
    const onSelect = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={makeCtx({ step: "student_type" })}
        onSelect={onSelect}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    const buttons = screen.getAllByRole("button")
    const irregularBtn = buttons.find(b => b.querySelector("span > span")?.textContent === "Irregular")!
    fireEvent.click(irregularBtn)
    expect(onSelect).toHaveBeenCalledWith("irregular")
  })
})

// ── year_level ────────────────────────────────────────────────────────
describe("year_level step", () => {
  it("renders all four year level buttons", () => {
    render(
      <EnrollStepRenderer
        ctx={makeCtx({ step: "year_level" })}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    expect(screen.getByRole("button", { name: "1st Year" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "2nd Year" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3rd Year" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "4th Year" })).toBeInTheDocument()
  })

  it("calls onSelect with the chosen year level", () => {
    const onSelect = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={makeCtx({ step: "year_level" })}
        onSelect={onSelect}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "2nd Year" }))
    expect(onSelect).toHaveBeenCalledWith("2nd Year")
  })
})

// ── program ───────────────────────────────────────────────────────────
describe("program step", () => {
  it("renders BSIT, BSCPE, BSCS buttons", () => {
    render(
      <EnrollStepRenderer
        ctx={makeCtx({ step: "program" })}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    expect(screen.getByRole("button", { name: "BSIT" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "BSCPE" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "BSCS" })).toBeInTheDocument()
  })

  it("calls onSelect with the chosen program", () => {
    const onSelect = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={makeCtx({ step: "program" })}
        onSelect={onSelect}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "BSIT" }))
    expect(onSelect).toHaveBeenCalledWith("BSIT")
  })
})

// ── review ────────────────────────────────────────────────────────────
describe("review step", () => {
  const reviewCtx = makeCtx({
    step:         "review",
    student_type: "regular",
    year_level:   "2nd Year",
    program:      "BSIT",
  })

  it("renders the enrollment summary", () => {
    render(
      <EnrollStepRenderer
        ctx={reviewCtx}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument()
    expect(screen.getByText("2024-10001")).toBeInTheDocument()
    expect(screen.getByText("Regular")).toBeInTheDocument()
    expect(screen.getByText("2nd Year")).toBeInTheDocument()
    expect(screen.getByText("BSIT")).toBeInTheDocument()
  })

  it("calls onConfirm when Confirm Enrollment is clicked", () => {
    const onConfirm = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={reviewCtx}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={onConfirm}
        onCancel={noop}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /confirm enrollment/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it("Confirm Enrollment button is disabled while submitting", () => {
    render(
      <EnrollStepRenderer
        ctx={{ ...reviewCtx, submitting: true }}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled()
  })

  it("calls onCancel when Start Over is clicked", () => {
    const onCancel = vi.fn()
    render(
      <EnrollStepRenderer
        ctx={reviewCtx}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /start over/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("shows error message when ctx.error is set", () => {
    render(
      <EnrollStepRenderer
        ctx={{ ...reviewCtx, error: "Enrollment failed. Please try again." }}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    expect(screen.getByText("Enrollment failed. Please try again.")).toBeInTheDocument()
  })

  it("returns null when ctx.active is false", () => {
    const { container } = render(
      <EnrollStepRenderer
        ctx={{ ...reviewCtx, active: false }}
        onSelect={noop}
        onSubjectChange={noop}
        onConfirm={noop}
        onCancel={noop}
      />
    )
    expect(container.firstChild).toBeNull()
  })
})
