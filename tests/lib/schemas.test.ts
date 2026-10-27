import { describe, it, expect } from "vitest"
import { ChatRequestSchema, EnrollmentSchema, UpdateEnrollmentSchema } from "@/lib/schemas"

describe("ChatRequestSchema", () => {
  it("rejects an empty message string", () => {
    expect(ChatRequestSchema.safeParse({ message: "" }).success).toBe(false)
  })

  it("accepts a valid message", () => {
    expect(ChatRequestSchema.safeParse({ message: "How do I enroll?" }).success).toBe(true)
  })

  it("rejects a message over 500 characters", () => {
    expect(ChatRequestSchema.safeParse({ message: "a".repeat(501) }).success).toBe(false)
  })
})

describe("EnrollmentSchema", () => {
  // student_id uses the new YYYY-NNNNN format
  const base = {
    full_name:    "Sam Torres",
    student_id:   "2024-01092",
    year_level:   "2nd Year",
    program:      "BSIT"
  }

  it("passes for a valid regular student (no subject_codes)", () => {
    expect(EnrollmentSchema.safeParse({ ...base, student_type: "regular" }).success).toBe(true)
  })

  it("passes for a valid irregular student with subject_codes", () => {
    expect(EnrollmentSchema.safeParse({
      ...base,
      student_type: "irregular",
      subject_codes: ["IT101", "IT201"]
    }).success).toBe(true)
  })

  it("fails when student_type is irregular but no subject_codes", () => {
    const result = EnrollmentSchema.safeParse({ ...base, student_type: "irregular" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/irregular students must select/i)
    }
  })

  it("fails when student_type is irregular but subject_codes is empty array", () => {
    const result = EnrollmentSchema.safeParse({ ...base, student_type: "irregular", subject_codes: [] })
    expect(result.success).toBe(false)
  })

  it("fails on missing full_name", () => {
    const { full_name: _, ...rest } = base
    expect(EnrollmentSchema.safeParse({ ...rest, student_type: "regular" }).success).toBe(false)
  })

  it("fails on missing student_id", () => {
    const { student_id: _, ...rest } = base
    expect(EnrollmentSchema.safeParse({ ...rest, student_type: "regular" }).success).toBe(false)
  })

  it("fails on invalid year_level", () => {
    expect(EnrollmentSchema.safeParse({ ...base, student_type: "regular", year_level: "5th Year" }).success).toBe(false)
  })

  // ── student_id format validation ──────────────────────────────────────
  it("accepts a valid student_id in YYYY-NNNNN format", () => {
    expect(EnrollmentSchema.safeParse({ ...base, student_type: "regular", student_id: "2024-01092" }).success).toBe(true)
  })

  it("rejects student_id with MN suffix (e.g. 2024-1092-MN-0)", () => {
    const result = EnrollmentSchema.safeParse({ ...base, student_type: "regular", student_id: "2024-1092-MN-0" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/YYYY-NNNNN/i)
    }
  })

  it("rejects student_id with fewer than 5 digits after the hyphen (e.g. 2024-1092)", () => {
    expect(EnrollmentSchema.safeParse({ ...base, student_type: "regular", student_id: "2024-1092" }).success).toBe(false)
  })

  it("rejects student_id with no year prefix (e.g. S10099)", () => {
    expect(EnrollmentSchema.safeParse({ ...base, student_type: "regular", student_id: "S10099" }).success).toBe(false)
  })

  it("rejects student_id with letters mixed in (e.g. 2024-A1092)", () => {
    expect(EnrollmentSchema.safeParse({ ...base, student_type: "regular", student_id: "2024-A1092" }).success).toBe(false)
  })
})

describe("UpdateEnrollmentSchema", () => {
  it("accepts confirmed", () => {
    expect(UpdateEnrollmentSchema.safeParse({ status: "confirmed" }).success).toBe(true)
  })

  it("accepts rejected", () => {
    expect(UpdateEnrollmentSchema.safeParse({ status: "rejected" }).success).toBe(true)
  })

  it("rejects pending", () => {
    expect(UpdateEnrollmentSchema.safeParse({ status: "pending" }).success).toBe(false)
  })

  it("rejects an arbitrary string", () => {
    expect(UpdateEnrollmentSchema.safeParse({ status: "maybe" }).success).toBe(false)
  })
})
