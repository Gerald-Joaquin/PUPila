import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import type { supabase as _supabase } from "@/lib/supabase"

// Partial mock builder cast — satisfies the full PostgrestQueryBuilder return
// type without implementing every property.
type FromReturn = ReturnType<typeof _supabase.from>

// ── Supabase mock ──────────────────────────────────────────────────────

const mockEnrollment = {
  id: 2, enr_number: "ENR-00002-MN-1", full_name: "Jordan Lee",
  student_id: "2024-10002", student_type: "irregular", year_level: "3rd Year",
  program: "BSIT", semester: "1st Semester", academic_year: "2025-2026",
  status: "pending", created_at: "2025-07-01T10:00:00Z", updated_at: "2025-07-01T10:00:00Z"
}

const mockSubjectRows = [
  { subject_code: "IT301", subject_name: "Web Systems and Technologies", units: 3 },
  { subject_code: "IT302", subject_name: "Networks and Communications",  units: 3 }
]

// call counter to distinguish GET (first enrollments call) from PATCH (second)
let enrollmentsCallCount = 0

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "enrollments") {
          enrollmentsCallCount++
          if (enrollmentsCallCount % 2 === 1) {
            // GET — fetch enrollment row by enr_number
            return {
              select: vi.fn().mockReturnThis(),
              eq:     vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: mockEnrollment, error: null })
            }
          } else {
            // PATCH — update status
            return {
              update: vi.fn().mockReturnThis(),
              eq:     vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { enr_number: "ENR-00002-MN-1", status: "confirmed", updated_at: "2025-07-01T15:00:00Z" },
                error: null
              })
            }
          }
        }
        if (table === "enrollment_subjects") {
          return {
            select: vi.fn().mockReturnThis(),
            eq:     vi.fn().mockResolvedValue({ data: mockSubjectRows, error: null })
          }
        }
        return {}
      })
    }
  }
})

const { GET, PATCH } = await import("@/app/api/enrollments/[enr]/route")

function makeGetRequest(enr: string) {
  return new NextRequest(`http://localhost/api/enrollments/${enr}`, { method: "GET" })
}

function makePatchRequest(enr: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/enrollments/${enr}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body:    JSON.stringify(body)
  })
}

const params = (enr: string) => ({ params: Promise.resolve({ enr }) })

describe("GET /api/enrollments/[enr]", () => {
  beforeEach(() => { vi.clearAllMocks(); enrollmentsCallCount = 0 })

  it("returns 200 with full enrollment detail and subjects array", async () => {
    const res = await GET(makeGetRequest("ENR-00002-MN-1"), params("ENR-00002-MN-1"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.enr_number).toBe("ENR-00002-MN-1")
    expect(json.status).toBe("pending")
    expect(Array.isArray(json.subjects)).toBe(true)
    expect(json.subjects[0]).toHaveProperty("code")
    expect(json.subjects[0]).toHaveProperty("name")
    expect(json.subjects[0]).toHaveProperty("units")
  })

  it("returns 404 when enrollment is not found", async () => {
    const { supabase } = await import("@/lib/supabase")
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } })
    } as unknown as FromReturn)
    const res = await GET(makeGetRequest("ENR-99999-MN-0"), params("ENR-99999-MN-0"))
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe("Enrollment not found")
  })
})

// ── PATCH helpers ────────────────────────────────────────────────────────

// updatedRow meanings:
//   undefined (default) — guard is expected to reject before reaching the UPDATE; do not queue an UPDATE mock
//   null               — simulate race: guard passes but UPDATE matches zero rows (data: null)
//   { ... }            — normal success path; UPDATE returns the updated row
function mockFetchThenUpdate(
  fetchRow: { status: string; student_type: string } | null,
  updatedRow?: { enr_number: string; status: string; updated_at: string } | null
) {
  return async () => {
    const { supabase } = await import("@/lib/supabase")
    // First call: SELECT to fetch current enrollment (guard read)
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data:  fetchRow ? { enr_number: "ENR-test", ...fetchRow } : null,
        error: fetchRow ? null : { message: "not found" },
      })
    } as unknown as FromReturn)
    // Second call: only queued when the route is expected to reach the UPDATE
    if (updatedRow !== undefined) {
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: updatedRow, error: null })
      } as unknown as FromReturn)
    }
  }
}

describe("PATCH /api/enrollments/[enr]", () => {
  beforeEach(() => { vi.clearAllMocks(); enrollmentsCallCount = 0 })

  // ── Auth + schema ──────────────────────────────────────────────────────

  it("returns 403 without the staff header", async () => {
    const res = await PATCH(
      makePatchRequest("ENR-00002-MN-1", { status: "confirmed" }),
      params("ENR-00002-MN-1")
    )
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe("Staff access required")
  })

  it("returns 400 for an invalid status value", async () => {
    const res = await PATCH(
      makePatchRequest("ENR-00002-MN-1", { status: "maybe" }, { "x-demo-role": "staff" }),
      params("ENR-00002-MN-1")
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Invalid status value")
  })

  it("returns 404 when enrollment does not exist", async () => {
    await mockFetchThenUpdate(null)()
    const res = await PATCH(
      makePatchRequest("ENR-99999-MN-1", { status: "confirmed" }, { "x-demo-role": "staff" }),
      params("ENR-99999-MN-1")
    )
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe("Enrollment not found")
  })

  // ── Valid transition: pending irregular → confirmed / rejected ─────────

  it("returns 200 when staff confirms a pending irregular enrollment", async () => {
    await mockFetchThenUpdate(
      { status: "pending", student_type: "irregular" },
      { enr_number: "ENR-00002-MN-1", status: "confirmed", updated_at: "2025-07-01T15:00:00Z" }
    )()
    const res = await PATCH(
      makePatchRequest("ENR-00002-MN-1", { status: "confirmed" }, { "x-demo-role": "staff" }),
      params("ENR-00002-MN-1")
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe("confirmed")
    expect(json.enr_number).toBe("ENR-00002-MN-1")
  })

  it("returns 200 when staff rejects a pending irregular enrollment", async () => {
    await mockFetchThenUpdate(
      { status: "pending", student_type: "irregular" },
      { enr_number: "ENR-00002-MN-1", status: "rejected", updated_at: "2025-07-01T16:00:00Z" }
    )()
    const res = await PATCH(
      makePatchRequest("ENR-00002-MN-1", { status: "rejected" }, { "x-demo-role": "staff" }),
      params("ENR-00002-MN-1")
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe("rejected")
  })

  // ── Transition guard: invalid cases → 409 ─────────────────────────────

  it("returns 409 when trying to update a regular (non-irregular) enrollment", async () => {
    await mockFetchThenUpdate({ status: "pending", student_type: "regular" })()
    const res = await PATCH(
      makePatchRequest("ENR-00001-MN-0", { status: "confirmed" }, { "x-demo-role": "staff" }),
      params("ENR-00001-MN-0")
    )
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe("Only irregular enrollments require manual approval")
  })

  it("returns 409 when trying to update an already-confirmed enrollment", async () => {
    await mockFetchThenUpdate({ status: "confirmed", student_type: "irregular" })()
    const res = await PATCH(
      makePatchRequest("ENR-00002-MN-1", { status: "rejected" }, { "x-demo-role": "staff" }),
      params("ENR-00002-MN-1")
    )
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe("Cannot update an enrollment that is already confirmed")
  })

  it("returns 409 when trying to update an already-rejected enrollment", async () => {
    await mockFetchThenUpdate({ status: "rejected", student_type: "irregular" })()
    const res = await PATCH(
      makePatchRequest("ENR-00002-MN-1", { status: "confirmed" }, { "x-demo-role": "staff" }),
      params("ENR-00002-MN-1")
    )
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe("Cannot update an enrollment that is already rejected")
  })

  // ── Race condition: guard read passed but UPDATE matched zero rows ─────

  it("returns 409 when the conditional UPDATE matches no rows (competing request won the race)", async () => {
    // The guard SELECT sees pending+irregular, so the application guard passes.
    // But the UPDATE's conditional .eq("status","pending").eq("student_type","irregular")
    // returns data:null without an error via maybeSingle(), simulating another request that confirmed the enrollment
    // in the gap between our SELECT and this UPDATE.
    await mockFetchThenUpdate(
      { status: "pending", student_type: "irregular" },
      null   // UPDATE returns no row
    )()
    const res = await PATCH(
      makePatchRequest("ENR-00002-MN-1", { status: "confirmed" }, { "x-demo-role": "staff" }),
      params("ENR-00002-MN-1")
    )
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe("Enrollment has already been reviewed by another request")
  })
})
