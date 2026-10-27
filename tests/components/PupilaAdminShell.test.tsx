/**
 * PupilaAdminShell — layout and navigation tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PupilaAdminShell } from "@/components/PupilaAdminShell"

// ── Mocks ─────────────────────────────────────────────────────────────

const mockUsePathname = vi.fn(() => "/admin")

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock("@/components/ChatWindow", () => ({
  ChatWindow: () => <div data-testid="chat-window">Chat</div>,
}))

vi.mock("@/components/RoleToggle", () => ({
  RoleToggle:   () => <button data-testid="role-toggle">Toggle Role</button>,
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

// ── Helpers ───────────────────────────────────────────────────────────

function renderShell(
  children: React.ReactNode = <div data-testid="page-content">Page content</div>
) {
  return render(<PupilaAdminShell>{children}</PupilaAdminShell>)
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("PupilaAdminShell — /admin", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/admin")
  })

  it("renders PUPILA wordmark in the header", () => {
    renderShell()
    expect(screen.getByText("PUPILA")).toBeInTheDocument()
  })

  it("renders exactly one nav link pointing to /admin (Dashboard)", () => {
    renderShell()
    const links = screen.getAllByRole("link")
    const adminLinks = links.filter(l => l.getAttribute("href") === "/admin")
    expect(adminLinks).toHaveLength(1)
    expect(adminLinks[0]).toHaveTextContent("Dashboard")
  })

  it("renders Requests as a link pointing to /admin/requests", () => {
    renderShell()
    const requestsLink = screen.getByRole("link", { name: /requests/i })
    expect(requestsLink).toHaveAttribute("href", "/admin/requests")
  })

  it("renders the RoleToggle in the header", () => {
    renderShell()
    expect(screen.getByTestId("role-toggle")).toBeInTheDocument()
  })

  it("renders page children inside the content area", () => {
    renderShell()
    expect(screen.getByTestId("page-content")).toBeInTheDocument()
  })

  it("renders the AI chat window panel on /admin", () => {
    renderShell()
    expect(screen.getByTestId("chat-window")).toBeInTheDocument()
  })

  it("renders PUPILA AI Assistant label in the AI panel", () => {
    renderShell()
    expect(screen.getByText("PUPILA AI Assistant")).toBeInTheDocument()
  })

  it("renders Online badge in the AI panel", () => {
    renderShell()
    expect(screen.getByText("Online")).toBeInTheDocument()
  })

  it("renders the semester context in the sidebar", () => {
    renderShell()
    expect(screen.getByText(/1ST SEMESTER/i)).toBeInTheDocument()
  })

  it("renders Enrollment Portal footer in the sidebar", () => {
    renderShell()
    expect(screen.getByText("Enrollment Portal")).toBeInTheDocument()
  })

  it("renders a hamburger toggle button for mobile", () => {
    renderShell()
    expect(screen.getByLabelText("Toggle navigation")).toBeInTheDocument()
  })

  it("toggles the sidebar on hamburger click without crashing", () => {
    renderShell()
    const hamburger = screen.getByLabelText("Toggle navigation")
    fireEvent.click(hamburger)
    expect(screen.getByLabelText("Toggle navigation")).toBeInTheDocument()
  })

  it("renders Reports as a disabled label, not a link", () => {
    renderShell()
    const reports = screen.getByText("Reports")
    expect(reports).toBeInTheDocument()
    expect(reports.closest("a")).toBeNull()
  })

  it("renders Powered by CampusAssist disclaimer in AI panel", () => {
    renderShell()
    expect(screen.getByText("Powered by CampusAssist")).toBeInTheDocument()
  })
})

describe("PupilaAdminShell — /admin/reports", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/admin/reports")
  })

  it("does NOT render the AI chat panel on /admin/reports", () => {
    renderShell(<div>Reports page</div>)
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument()
  })

  it("renders Reports as a disabled label on /admin/reports", () => {
    renderShell(<div>Reports page</div>)
    const reports = screen.getByText("Reports")
    expect(reports).toBeInTheDocument()
    expect(reports.closest("a")).toBeNull()
  })
})
