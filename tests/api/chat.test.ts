import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock lib/ai before importing the route
vi.mock("@/lib/ai", () => ({
  getAIResponse: vi.fn((message: string) => {
    if (message === "How do I enroll?") {
      return { answer: "To enroll...", source: "Enrollment Overview", type: "info", items: null }
    }
    if (message === "What subjects are available?") {
      return { answer: "Available subjects:", source: "Choosing Subjects", type: "checklist", items: ["IT101"] }
    }
    return { answer: "I don't have information about that.", source: null, type: "unknown", items: null }
  })
}))

// Import route handler AFTER mocks are set up
const { POST } = await import("@/app/api/chat/route")

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
}

describe("POST /api/chat", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 200 with matched AIResponse for a known keyword", async () => {
    const res = await POST(makeRequest({ message: "How do I enroll?" }) as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.type).toBe("info")
    expect(json.source).toBe("Enrollment Overview")
  })

  it("returns 200 with type unknown for an unrecognised message", async () => {
    const res = await POST(makeRequest({ message: "random gibberish xyz" }) as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.type).toBe("unknown")
    expect(json.source).toBeNull()
  })

  it("returns 400 for an empty body", async () => {
    const res = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }) as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json"
    }) as any)
    expect(res.status).toBe(400)
  })
})
