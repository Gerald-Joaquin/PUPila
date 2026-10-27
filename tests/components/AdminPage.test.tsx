/**
 * AdminPage — not-staff view-switch tests
 *
 * Verifies that a non-staff user visiting /admin sees:
 * - the lock screen (access required message)
 * - a link back to the student portal (/)
 * - no enrollment table
 */
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import AdminPage from "@/app/admin/page"

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock("@/components/RoleToggle", () => ({
  RoleToggle:   () => <button>Toggle Role</button>,
  RoleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useRole:      () => ({ isStaff: false, toggleRole: vi.fn() }),
}))

vi.mock("@/components/AdminTable", () => ({
  AdminTable: () => <div data-testid="admin-table">Table</div>,
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

// ── Tests ─────────────────────────────────────────────────────────────

describe("AdminPage — non-staff user", () => {
  it("shows the access-required message", () => {
    render(<AdminPage />)
    expect(screen.getByText("Staff access required")).toBeInTheDocument()
  })

  it("renders a link back to the student portal (/)", () => {
    render(<AdminPage />)
    const backLink = screen.getByRole("link", { name: /back to student portal/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/")
  })

  it("does NOT render the enrollment table", () => {
    render(<AdminPage />)
    expect(screen.queryByTestId("admin-table")).not.toBeInTheDocument()
  })
})
