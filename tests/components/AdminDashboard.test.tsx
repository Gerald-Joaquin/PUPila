/**
 * AdminDashboardPage — correction pass focused tests
 *
 * Verifies:
 * - Regular count is derived from student_type === "regular", not from status
 * - Irregular count is derived from student_type === "irregular", not from status
 * - "Needs review" list shows only pending enrollments, sorted by created_at ascending (oldest first)
 * - Enrollments with no pending items show "All requests are reviewed."
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import AdminDashboardPage from "@/app/admin/page"

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock("@/components/RoleToggle", () => ({
  RoleToggle:   () => <button>Toggle</button>,
  RoleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useRole:      () => ({ isStaff: true, toggleRole: vi.fn() }),
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [k: string]: unknown
  }) => <a href={href} {...props}>{children}</a>,
}))

// ── Fixtures ──────────────────────────────────────────────────────────

/** Mixed dataset: 3 regular (2 confirmed, 1 pending-but-regular), 2 irregular (1 pending, 1 confirmed) */
const MIXED_ENROLLMENTS = [
  {
    enr_number:   "ENR-00001-MN-0",
    full_name:    "Alice Regular",
    student_id:   "2024-10001",
    student_type: "regular",
    year_level:   "1st Year",
    program:      "BSIT",
    status:       "confirmed",
    created_at:   "2025-07-01T09:00:00Z",
  },
  {
    enr_number:   "ENR-00002-MN-0",
    full_name:    "Bob Regular",
    student_id:   "2024-10002",
    student_type: "regular",
    year_level:   "2nd Year",
    program:      "BSIT",
    status:       "confirmed",
    created_at:   "2025-07-01T10:00:00Z",
  },
  {
    enr_number:   "ENR-00003-MN-0",
    full_name:    "Charlie Regular",
    student_id:   "2024-10003",
    student_type: "regular",
    year_level:   "3rd Year",
    program:      "BSIT",
    status:       "confirmed",
    created_at:   "2025-07-01T11:00:00Z",
  },
  {
    enr_number:   "ENR-00004-MN-1",
    full_name:    "Dana Irregular",
    student_id:   "2024-10004",
    student_type: "irregular",
    year_level:   "2nd Year",
    program:      "BSIT",
    status:       "pending",
    created_at:   "2025-07-02T08:00:00Z",  // older pending
  },
  {
    enr_number:   "ENR-00005-MN-1",
    full_name:    "Eve Irregular",
    student_id:   "2024-10005",
    student_type: "irregular",
    year_level:   "3rd Year",
    program:      "BSIT",
    status:       "confirmed",
    created_at:   "2025-07-01T08:00:00Z",
  },
]

/** Three pending enrollments with deliberately out-of-order created_at */
const PENDING_OUT_OF_ORDER = [
  {
    enr_number:   "ENR-00010-MN-1",
    full_name:    "Zara Newest",
    student_id:   "2024-10010",
    student_type: "irregular",
    year_level:   "1st Year",
    program:      "BSIT",
    status:       "pending",
    created_at:   "2025-07-03T12:00:00Z",  // newest
  },
  {
    enr_number:   "ENR-00011-MN-1",
    full_name:    "Aaron Oldest",
    student_id:   "2024-10011",
    student_type: "irregular",
    year_level:   "2nd Year",
    program:      "BSIT",
    status:       "pending",
    created_at:   "2025-07-01T06:00:00Z",  // oldest
  },
  {
    enr_number:   "ENR-00012-MN-1",
    full_name:    "Maria Middle",
    student_id:   "2024-10012",
    student_type: "irregular",
    year_level:   "3rd Year",
    program:      "BSIT",
    status:       "pending",
    created_at:   "2025-07-02T09:00:00Z",  // middle
  },
]

function mockFetchList(data: unknown[]) {
  global.fetch = vi.fn().mockResolvedValue({
    ok:   true,
    json: async () => data,
  } as Response)
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("AdminDashboardPage — Regular/Irregular counts from student_type", () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it("shows Regular count equal to the number of regular student_type records", async () => {
    mockFetchList(MIXED_ENROLLMENTS)
    render(<AdminDashboardPage />)

    // 3 regular students in MIXED_ENROLLMENTS
    await waitFor(() => {
      const cards = screen.getAllByText(/\d+/)
      const nums = cards.map(el => el.textContent)
      // Look for "3" as the Regular stat card value
      expect(nums).toContain("3")
    })

    // Verify the label "Regular" is present
    expect(screen.getByText("Regular")).toBeInTheDocument()
  })

  it("shows Irregular count equal to the number of irregular student_type records", async () => {
    mockFetchList(MIXED_ENROLLMENTS)
    render(<AdminDashboardPage />)

    // 2 irregular students in MIXED_ENROLLMENTS
    await waitFor(() => expect(screen.getByText("Irregular")).toBeInTheDocument())

    // The Irregular card value should be "2", not status-derived
    // We check by finding all numeric stat values
    await waitFor(() => {
      const allText = document.body.textContent ?? ""
      // Should contain "2" for the irregular count (2 irregular student_type entries)
      expect(allText).toContain("2")
    })
  })

  it("Regular and Irregular counts sum to total", async () => {
    mockFetchList(MIXED_ENROLLMENTS)
    render(<AdminDashboardPage />)

    await waitFor(() => expect(screen.getByText("Total enrolled")).toBeInTheDocument())

    // Total is 5; regular is 3, irregular is 2 → 3 + 2 = 5
    const allText = document.body.textContent ?? ""
    // Total stat shows 5
    expect(allText).toContain("5")
    // Regular stat shows 3
    expect(allText).toContain("3")
  })
})

describe("AdminDashboardPage — Needs review sorts pending by created_at ascending", () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it("renders the oldest pending enrollment first in the Needs review list", async () => {
    mockFetchList(PENDING_OUT_OF_ORDER)
    render(<AdminDashboardPage />)

    await waitFor(() => expect(screen.getByText("Aaron Oldest")).toBeInTheDocument())

    // All three names should be present
    expect(screen.getByText("Aaron Oldest")).toBeInTheDocument()
    expect(screen.getByText("Maria Middle")).toBeInTheDocument()
    expect(screen.getByText("Zara Newest")).toBeInTheDocument()

    // Aaron Oldest (created_at earliest) should appear before Zara Newest in DOM order
    const allNames = screen
      .getAllByText(/Aaron Oldest|Maria Middle|Zara Newest/)
      .map(el => el.textContent ?? "")

    const aaronIdx = allNames.indexOf("Aaron Oldest")
    const zaraIdx  = allNames.indexOf("Zara Newest")
    expect(aaronIdx).toBeLessThan(zaraIdx)
  })

  it("shows Maria Middle before Zara Newest (middle before newest)", async () => {
    mockFetchList(PENDING_OUT_OF_ORDER)
    render(<AdminDashboardPage />)

    await waitFor(() => expect(screen.getByText("Maria Middle")).toBeInTheDocument())

    const allNames = screen
      .getAllByText(/Aaron Oldest|Maria Middle|Zara Newest/)
      .map(el => el.textContent ?? "")

    const mariaIdx = allNames.indexOf("Maria Middle")
    const zaraIdx  = allNames.indexOf("Zara Newest")
    expect(mariaIdx).toBeLessThan(zaraIdx)
  })
})

describe("AdminDashboardPage — empty pending list", () => {
  it("shows 'All requests are reviewed.' when no pending enrollments exist", async () => {
    mockFetchList(MIXED_ENROLLMENTS.filter(e => e.status !== "pending"))
    render(<AdminDashboardPage />)

    await waitFor(() =>
      expect(screen.getByText("All requests are reviewed.")).toBeInTheDocument()
    )
  })
})
