import { describe, it, expect } from "vitest"
import { generateEnrNumber } from "@/lib/utils"

describe("generateEnrNumber", () => {
  it("pads id=1 to 5 digits for a regular student", () => {
    expect(generateEnrNumber(1, "regular")).toBe("ENR-00001-MN-0")
  })

  it("pads id=42 to 5 digits for a regular student", () => {
    expect(generateEnrNumber(42, "regular")).toBe("ENR-00042-MN-0")
  })

  it("pads id=9999 to 5 digits for a regular student", () => {
    expect(generateEnrNumber(9999, "regular")).toBe("ENR-09999-MN-0")
  })

  it("pads id=99999 to 5 digits", () => {
    expect(generateEnrNumber(99999, "irregular")).toBe("ENR-99999-MN-1")
  })

  it("does not truncate ids above 99999", () => {
    expect(generateEnrNumber(100000, "regular")).toBe("ENR-100000-MN-0")
  })

  it("uses flag 1 for irregular students", () => {
    expect(generateEnrNumber(5, "irregular")).toBe("ENR-00005-MN-1")
  })

  it("uses flag 0 for regular students", () => {
    expect(generateEnrNumber(5, "regular")).toBe("ENR-00005-MN-0")
  })
})
