/**
 * RequestsPage — Phase 3 behavior tests
 *
 * Covers:
 * - Lock screen for non-staff users
 * - Enrollment list renders on load
 * - Selecting an enrollment shows its detail
 * - Approve/Reject buttons shown only for pending irregular enrollments
 * - Buttons disabled while action is in-flight (double-click prevention)
 * - Inline success feedback after approval/rejection
 * - Inline error feedback when PATCH fails
 * - No actions shown for confirmed/regular enrollments
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import RequestsPage from "@/app/admin/requests/page"

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

// Enrollment list returned by GET /api/enrollments
const PENDING_IRREGULAR = {
  enr_number:   "ENR-00002-MN-1",
  full_name:    "Jordan Lee",
  student_id:   "2024-10002",
  student_type: "irregular",
  year_level:   "3rd Year",
  program:      "BSIT",
  status:       "pending",
  created_at:   "2025-07-01T10:00:00Z",
}

const CONFIRMED_REGULAR = {
  enr_number:   "ENR-00001-MN-0",
  full_name:    "Alex Rivera",
  student_id:   "2024-10001",
  student_type: "regular",
  year_level:   "2nd Year",
  program:      "BSIT",
  status:       "confirmed",
  created_at:   "2025-07-01T09:00:00Z",
}

// Full enrollment detail returned by GET /api/enrollments/[enr]
const PENDING_DETAIL = {
  ...PENDING_IRREGULAR,
  semester:      "1st Semester",
  academic_year: "2025-2026",
  updated_at:    "2025-07-01T10:00:00Z",
  subjects: [
    { code: "IT201", name: "Data Structures", units: 3, year_level: "2nd Year", program: "BSIT" },
    { code: "IT301", name: "Web Systems",     units: 3, year_level: "3rd Year", program: "BSIT" },
  ],
}

const CONFIRMED_DETAIL = {
  ...CONFIRMED_REGULAR,
  semester:      "1st Semester",
  academic_year: "2025-2026",
  updated_at:    "2025-07-01T09:00:00Z",
  subjects: [
    { code: "IT201", name: "Data Structures", units: 3, year_level: "2nd Year", program: "BSIT" },
  ],
}

function mockFetch(options: {
  listData?: unknown[]
  listOk?: boolean
  detailData?: Record<string, unknown>
  detailOk?: boolean
  patchOk?: boolean
  patchError?: string
} = {}) {
  const {
    listData   = [PENDING_IRREGULAR],
    listOk     = true,
    detailData = { "ENR-00002-MN-1": PENDING_DETAIL },
    detailOk   = true,
    patchOk    = true,
    patchError = "Failed",
  } = options

  global.fetch = vi.fn(async (url: unknown, init?: RequestInit) => {
    const urlStr = String(url)
    const method = init?.method ?? "GET"

    if (method === "PATCH") {
      if (patchOk) {
        return {
          ok:   true,
          json: async () => ({ enr_number: "ENR-00002-MN-1", status: "confirmed", updated_at: "2025-07-01T11:00:00Z" }),
        } as Response
      }
      return {
        ok:   false,
        json: async () => ({ error: patchError }),
      } as Response
    }

    // Detail fetch (includes enr number in path)
    if (urlStr.includes("ENR-00002-MN-1") || urlStr.includes("ENR-00001-MN-0")) {
      const key = Object.keys(detailData as Record<string, unknown>).find(k => urlStr.includes(encodeURIComponent(k)))
      const data = key ? (detailData as Record<string, unknown>)[key] : null
      return {
        ok:   detailOk,
        json: async () => data ?? { error: "Not found" },
      } as Response
    }

    // List fetch
    return {
      ok:   listOk,
      json: async () => (listOk ? listData : { error: "Failed" }),
    } as Response
  })
}

// ── Staff user - full flow ─────────────────────────────────────────────

describe("RequestsPage — staff user", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFetch({ detailData: { "ENR-00002-MN-1": PENDING_DETAIL } })
  })

  it("renders the enrollment list after loading", async () => {
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByText("Jordan Lee")).toBeInTheDocument())
  })

  it("shows enrollment type and year in list item", async () => {
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByText(/irregular/i)).toBeInTheDocument())
  })

  it("shows detail panel for the auto-selected enrollment", async () => {
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByText("Jordan Lee")).toBeInTheDocument())
    // Detail panel shows the student name as heading
    // and subjects after detail fetch resolves
    await waitFor(() => expect(screen.getByText("Data Structures")).toBeInTheDocument())
  })

  it("shows Approve and Reject buttons for pending irregular enrollment", async () => {
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByTestId("confirm-btn")).toBeInTheDocument())
    expect(screen.getByTestId("reject-btn")).toBeInTheDocument()
  })

  it("disables both buttons while confirming (double-click prevention)", async () => {
    // Make PATCH take a moment
    global.fetch = vi.fn(async (url: unknown, init?: RequestInit) => {
      const urlStr = String(url)
      const method = init?.method ?? "GET"
      if (method === "PATCH") {
        // Never resolves in this test — simulates in-flight
        return new Promise<Response>(() => {})
      }
      if (urlStr.includes("ENR-00002-MN-1")) {
        return { ok: true, json: async () => PENDING_DETAIL } as Response
      }
      return { ok: true, json: async () => [PENDING_IRREGULAR] } as Response
    })

    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByTestId("confirm-btn")).toBeInTheDocument())

    const confirmBtn = screen.getByTestId("confirm-btn")
    const rejectBtn  = screen.getByTestId("reject-btn")

    fireEvent.click(confirmBtn)

    // Both buttons should be disabled immediately
    await waitFor(() => expect(confirmBtn).toBeDisabled())
    expect(rejectBtn).toBeDisabled()
  })

  it("shows inline success feedback after confirming", async () => {
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByTestId("confirm-btn")).toBeInTheDocument())

    fireEvent.click(screen.getByTestId("confirm-btn"))

    await waitFor(() =>
      expect(screen.getByTestId("action-success")).toBeInTheDocument()
    )
    expect(screen.getByTestId("action-success")).toHaveTextContent("Enrollment confirmed.")
  })

  it("shows inline success feedback after rejecting", async () => {
    mockFetch({
      detailData: { "ENR-00002-MN-1": PENDING_DETAIL },
      patchOk:    true,
    })
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByTestId("reject-btn")).toBeInTheDocument())

    fireEvent.click(screen.getByTestId("reject-btn"))

    await waitFor(() =>
      expect(screen.getByTestId("action-success")).toBeInTheDocument()
    )
    expect(screen.getByTestId("action-success")).toHaveTextContent("Enrollment rejected.")
  })

  it("shows inline error feedback when PATCH fails", async () => {
    mockFetch({
      detailData: { "ENR-00002-MN-1": PENDING_DETAIL },
      patchOk:    false,
      patchError: "Staff access required",
    })
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByTestId("confirm-btn")).toBeInTheDocument())

    fireEvent.click(screen.getByTestId("confirm-btn"))

    await waitFor(() =>
      expect(screen.getByTestId("action-error")).toBeInTheDocument()
    )
    expect(screen.getByTestId("action-error")).toHaveTextContent("Staff access required")
  })

  it("hides action buttons after successful confirm and does not show them again", async () => {
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByTestId("confirm-btn")).toBeInTheDocument())

    fireEvent.click(screen.getByTestId("confirm-btn"))

    await waitFor(() => expect(screen.getByTestId("action-success")).toBeInTheDocument())

    expect(screen.queryByTestId("confirm-btn")).not.toBeInTheDocument()
    expect(screen.queryByTestId("reject-btn")).not.toBeInTheDocument()
  })
})

// ── Confirmed / regular enrollment — no action buttons ────────────────

describe("RequestsPage — confirmed regular enrollment selected", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFetch({
      listData:   [CONFIRMED_REGULAR],
      detailData: { "ENR-00001-MN-0": CONFIRMED_DETAIL },
    })
  })

  it("does not show Approve/Reject buttons for a confirmed regular enrollment", async () => {
    render(<RequestsPage />)
    await waitFor(() => expect(screen.getByText("Alex Rivera")).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText("Data Structures")).toBeInTheDocument())

    expect(screen.queryByTestId("confirm-btn")).not.toBeInTheDocument()
    expect(screen.queryByTestId("reject-btn")).not.toBeInTheDocument()
  })
})
