import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Supabase mock ──────────────────────────────────────────────────────

const mockEnrollmentsList = [
  { enr_number: "ENR-00001-MN-0", full_name: "Alex Rivera", student_id: "2025-10001",
    student_type: "regular", year_level: "2nd Year", program: "BSIT",
    status: "confirmed", created_at: "2025-07-01T09:00:00Z" }
]

const mockCurricula = [
  { subject_code: "IT201", subject_name: "Data Structures and Algorithms", units: 3 },
  { subject_code: "IT202", subject_name: "Object-Oriented Programming",    units: 3 }
]

const mockSubjectsPool = [
  { code: "IT101", name: "Introduction to Computing", units: 3 },
  { code: "IT203", name: "Database Management Systems", units: 3 }
]

// Tracks which table was queried to return the right mock data
let insertedEnrollmentId = 5

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "enrollments") {
          return {
            // GET list
            select: vi.fn().mockReturnThis(),
            eq:     vi.fn().mockReturnThis(),
            order:  vi.fn().mockResolvedValue({ data: mockEnrollmentsList, error: null }),
            // INSERT
            insert: vi.fn(() => ({
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: insertedEnrollmentId }, error: null })
            })),
            // UPDATE enr_number
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null })
            })),
            // DELETE rollback
            delete: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null })
            }))
          }
        }
        if (table === "curricula") {
          const curriculaChain: any = {
            select: vi.fn().mockReturnThis(),
            eq:     vi.fn(() => curriculaChain)
          }
          // Make the chain itself awaitable (thenable) — resolves on await
          curriculaChain.then = vi.fn((resolve: any) => resolve({ data: mockCurricula, error: null }))
          return curriculaChain
        }
        if (table === "subjects") {
          return {
            select: vi.fn().mockReturnThis(),
            in:     vi.fn().mockResolvedValue({ data: mockSubjectsPool, error: null })
          }
        }
        if (table === "enrollment_subjects") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null })
          }
        }
        return {}
      })
    }
  }
})

vi.mock("@/lib/utils", () => ({
  cn: vi.fn(),
  generateEnrNumber: vi.fn((id: number, studentType: string) =>
    `ENR-${String(id).padStart(5, "0")}-MN-${studentType === "regular" ? "0" : "1"}`
  )
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit:   vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })),
  getClientIp: vi.fn(() => "127.0.0.1")
}))

const { GET, POST } = await import("@/app/api/enrollments/route")

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body)
  })
}

function makeGetRequest(headers: Record<string, string> = {}, url = "http://localhost/api/enrollments") {
  return new NextRequest(url, {
    method: "GET",
    headers
  })
}

describe("GET /api/enrollments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 403 without x-demo-role: staff header", async () => {
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe("Staff access required")
  })

  it("returns 200 with enrollments array when staff header is present", async () => {
    const res = await GET(makeGetRequest({ "x-demo-role": "staff" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })

  it("returns 200 with filtered results when ?status=pending is provided", async () => {
    const res = await GET(makeGetRequest(
      { "x-demo-role": "staff" },
      "http://localhost/api/enrollments?status=pending"
    ))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })

  it("returns 200 with all results when ?status=invalid is provided", async () => {
    const res = await GET(makeGetRequest(
      { "x-demo-role": "staff" },
      "http://localhost/api/enrollments?status=invalid"
    ))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })
})

describe("POST /api/enrollments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 201 with status confirmed for a regular student", async () => {
    const res = await POST(makeRequest({
      full_name: "Test Regular", student_id: "2025-99001",
      student_type: "regular", year_level: "2nd Year", program: "BSIT"
    }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.status).toBe("confirmed")
    expect(json.enr_number).toMatch(/^ENR-\d{5}-MN-[01]$/)
    expect(Array.isArray(json.subjects)).toBe(true)
  })

  it("returns 201 with status pending for an irregular student", async () => {
    const res = await POST(makeRequest({
      full_name: "Test Irregular", student_id: "2025-99002",
      student_type: "irregular", year_level: "2nd Year", program: "BSIT",
      subject_codes: ["IT101", "IT203"]
    }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.status).toBe("pending")
    expect(Array.isArray(json.subjects)).toBe(true)
  })

  it("returns 400 when irregular student sends no subject_codes", async () => {
    const res = await POST(makeRequest({
      full_name: "Bad User", student_id: "2025-99003",
      student_type: "irregular", year_level: "2nd Year", program: "BSIT"
    }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/irregular students must select/i)
  })

  it("returns 400 for a missing required field", async () => {
    const res = await POST(makeRequest({
      student_id: "2025-99004", student_type: "regular",
      year_level: "1st Year", program: "BSIT"
      // full_name missing
    }))
    expect(res.status).toBe(400)
  })

  it("returns 429 when rate limit is exceeded", async () => {
    const { rateLimit } = await import("@/lib/rate-limit")
    vi.mocked(rateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() })
    const res = await POST(makeRequest({
      full_name: "Rate Limited", student_id: "2025-99005",
      student_type: "regular", year_level: "1st Year", program: "BSIT"
    }))
    expect(res.status).toBe(429)
  })
})
