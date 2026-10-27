import { describe, it, expect } from "vitest"
import { getAIResponse } from "@/lib/ai"

describe("getAIResponse", () => {
  it("returns the correct KB entry for a known keyword", () => {
    const res = getAIResponse("How do I enroll?")
    expect(res.type).toBe("info")
    expect(res.source).toBe("Enrollment Overview")
    expect(res.answer).toBeTruthy()
  })

  it("returns type checklist and non-null items for a checklist keyword", () => {
    const res = getAIResponse("What subjects are available?")
    expect(res.type).toBe("checklist")
    expect(Array.isArray(res.items)).toBe(true)
    expect(res.items!.length).toBeGreaterThan(0)
    expect(res.source).toBe("Choosing Subjects")
  })

  it("returns type unknown and null source for an unrecognised message", () => {
    const res = getAIResponse("What is the tuition fee?")
    expect(res.type).toBe("unknown")
    expect(res.source).toBeNull()
    expect(res.items).toBeNull()
  })

  it("is case-insensitive — uppercase input still matches", () => {
    const res = getAIResponse("HOW DO I ENROLL")
    expect(res.type).not.toBe("unknown")
    expect(res.source).toBe("Enrollment Overview")
  })

  it("returns unknown for an empty string", () => {
    const res = getAIResponse("")
    expect(res.type).toBe("unknown")
    expect(res.source).toBeNull()
  })

  it("matches irregular student keyword", () => {
    const res = getAIResponse("I am an irregular student")
    expect(res.source).toBe("Irregular Student Enrollment")
  })

  it("matches regular student keyword", () => {
    const res = getAIResponse("I am a regular student")
    expect(res.source).toBe("Regular Student Enrollment")
  })
})
