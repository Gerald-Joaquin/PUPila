import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockSubjects = [
  { code: "IT101", name: "Introduction to Computing",       units: 3, year_level: "1st Year", program: "BSIT" },
  { code: "IT201", name: "Data Structures and Algorithms",  units: 3, year_level: "2nd Year", program: "BSIT" }
]

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: mockSubjects, error: null })
    }))
  }
}))

const { GET } = await import("@/app/api/subjects/route")

function makeRequest(url = "http://localhost/api/subjects") {
  return new NextRequest(url, { method: "GET" })
}

describe("GET /api/subjects", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 200 with an array of subjects", async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBe(2)
  })

  it("each subject has code, name, units, year_level, program", async () => {
    const res = await GET(makeRequest())
    const json = await res.json()
    const subject = json[0]
    expect(subject).toHaveProperty("code")
    expect(subject).toHaveProperty("name")
    expect(subject).toHaveProperty("units")
    expect(subject).toHaveProperty("year_level")
    expect(subject).toHaveProperty("program")
  })

  it("returns 200 filtering by ?program=BSCS", async () => {
    const res = await GET(makeRequest("http://localhost/api/subjects?program=BSCS"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })

  it("returns 200 with all subjects when ?program= is invalid", async () => {
    const res = await GET(makeRequest("http://localhost/api/subjects?program=INVALID"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })
})
