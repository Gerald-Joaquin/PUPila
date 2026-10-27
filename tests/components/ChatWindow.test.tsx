/**
 * ChatWindow — enrollment wizard integration tests
 *
 * These tests cover the new wizard path added by the chat-driven enrollment feature.
 * They mock next/navigation, supabase-browser, and the fetch API.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Suspense } from "react"
import { ChatWindow } from "@/components/ChatWindow"

// jsdom does not implement scrollIntoView — stub it globally
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Wrap ChatWindow in Suspense (needed because it uses useSearchParams)
function WrappedChatWindow() {
  return (
    <Suspense fallback={null}>
      <ChatWindow />
    </Suspense>
  )
}

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter:      () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock("@/lib/supabase-browser", () => ({
  supabaseBrowser: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
  },
}))

vi.mock("@/components/ChecklistCard", () => ({
  ChecklistCard: () => <div data-testid="checklist-card" />,
}))

vi.mock("@/components/EnrollStepRenderer", () => ({
  EnrollStepRenderer: ({
    ctx,
    onSelect,
    onCancel,
    onConfirm,
  }: {
    ctx: { step: string; active: boolean }
    onSelect:  (v: string) => void
    onCancel:  () => void
    onConfirm: () => void
  }) => {
    if (!ctx.active) return null
    return (
      <div data-testid={`enroll-step-${ctx.step}`}>
        <button onClick={() => onSelect("confirmed")}>Confirm identity</button>
        <button onClick={() => onSelect("regular")}>Select Regular</button>
        <button onClick={() => onSelect("1st Year")}>Select 1st Year</button>
        <button onClick={() => onSelect("BSIT")}>Select BSIT</button>
        <button onClick={() => onSelect("continue")}>Continue subjects</button>
        <button onClick={onConfirm}>Confirm Enrollment</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    )
  },
}))

// ── SSE helper — builds a ReadableStream from an array of SSE lines ───
function makeSseStream(events: object[]): Response {
  const lines = events.map(e => `data: ${JSON.stringify(e)}\n\n`).join("")
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      ctrl.enqueue(new TextEncoder().encode(lines))
      ctrl.close()
    },
  })
  return new Response(stream, { status: 200 })
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("ChatWindow — normal chat (wizard inactive)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("renders the initial greeting message", () => {
    render(<WrappedChatWindow />)
    expect(screen.getByText(/CampusAssist AI/i)).toBeInTheDocument()
  })

  it("shows the suggestion chips on mount", () => {
    render(<WrappedChatWindow />)
    expect(screen.getByRole("button", { name: "Enroll me" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "How do I enroll?" })).toBeInTheDocument()
  })

  it("hides chips and shows a user message after sending text", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "chunk", text: "Here is some info." },
        { type: "done" },
      ])
    )

    render(<WrappedChatWindow />)
    const input = screen.getByPlaceholderText(/ask ai/i)
    fireEvent.change(input, { target: { value: "When does enrollment open?" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Enroll me" })).not.toBeInTheDocument()
    })

    expect(screen.getByText("When does enrollment open?")).toBeInTheDocument()
  })
})

describe("ChatWindow — enrollment wizard activation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("activates the wizard when enroll_start SSE event is received", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "enroll_start", full_name: "Alex Rivera", student_id: "2024-10001" },
        { type: "done" },
      ])
    )

    render(<WrappedChatWindow />)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enroll me" }))
    })

    await waitFor(() => {
      expect(
        screen.getByText("Let's get you enrolled! First, let me confirm your details.")
      ).toBeInTheDocument()
    })

    // The wizard step renderer should be visible
    await waitFor(() => {
      expect(screen.getByTestId("enroll-step-confirm_identity")).toBeInTheDocument()
    })
  })

  it("hides the text input bar when wizard is active", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "enroll_start", full_name: "Alex Rivera", student_id: "2024-10001" },
        { type: "done" },
      ])
    )

    render(<WrappedChatWindow />)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enroll me" }))
    })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/ask ai/i)).not.toBeInTheDocument()
    })
  })

  it("shows the Cancel enrollment link when wizard is active", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "enroll_start", full_name: "Alex Rivera", student_id: "2024-10001" },
        { type: "done" },
      ])
    )

    render(<WrappedChatWindow />)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enroll me" }))
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel enrollment/i })).toBeInTheDocument()
    })
  })
})

describe("ChatWindow — wizard step progression", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  async function activateWizard() {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "enroll_start", full_name: "Alex Rivera", student_id: "2024-10001" },
        { type: "done" },
      ])
    )
    render(<WrappedChatWindow />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enroll me" }))
    })
    await waitFor(() => {
      expect(screen.getByTestId("enroll-step-confirm_identity")).toBeInTheDocument()
    })
  }

  it("advances from confirm_identity to student_type on confirmation", async () => {
    await activateWizard()

    fireEvent.click(screen.getByRole("button", { name: "Confirm identity" }))

    await waitFor(() => {
      expect(screen.getByTestId("enroll-step-student_type")).toBeInTheDocument()
    })
  })

  it("advances from student_type to year_level", async () => {
    await activateWizard()
    fireEvent.click(screen.getByRole("button", { name: "Confirm identity" }))
    await waitFor(() => screen.getByTestId("enroll-step-student_type"))

    fireEvent.click(screen.getByRole("button", { name: "Select Regular" }))
    await waitFor(() => {
      expect(screen.getByTestId("enroll-step-year_level")).toBeInTheDocument()
    })
  })

  it("advances from year_level to program", async () => {
    await activateWizard()
    fireEvent.click(screen.getByRole("button", { name: "Confirm identity" }))
    await waitFor(() => screen.getByTestId("enroll-step-student_type"))
    fireEvent.click(screen.getByRole("button", { name: "Select Regular" }))
    await waitFor(() => screen.getByTestId("enroll-step-year_level"))

    fireEvent.click(screen.getByRole("button", { name: "Select 1st Year" }))
    await waitFor(() => {
      expect(screen.getByTestId("enroll-step-program")).toBeInTheDocument()
    })
  })

  it("advances from program to review for a regular student", async () => {
    await activateWizard()
    fireEvent.click(screen.getByRole("button", { name: "Confirm identity" }))
    await waitFor(() => screen.getByTestId("enroll-step-student_type"))
    fireEvent.click(screen.getByRole("button", { name: "Select Regular" }))
    await waitFor(() => screen.getByTestId("enroll-step-year_level"))
    fireEvent.click(screen.getByRole("button", { name: "Select 1st Year" }))
    await waitFor(() => screen.getByTestId("enroll-step-program"))

    // For a regular student, selecting program should skip subjects → review
    fireEvent.click(screen.getByRole("button", { name: "Select BSIT" }))
    await waitFor(() => {
      expect(screen.getByTestId("enroll-step-review")).toBeInTheDocument()
    })
  })
})

describe("ChatWindow — wizard cancel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("restores the text input when Cancel enrollment is clicked", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "enroll_start", full_name: "Alex Rivera", student_id: "2024-10001" },
        { type: "done" },
      ])
    )

    render(<WrappedChatWindow />)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enroll me" }))
    })

    await waitFor(() => screen.getByRole("button", { name: /cancel enrollment/i }))

    fireEvent.click(screen.getByRole("button", { name: /cancel enrollment/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask ai/i)).toBeInTheDocument()
    })
  })

  it("shows a cancellation message in the chat after cancelling", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "enroll_start", full_name: "Alex Rivera", student_id: "2024-10001" },
        { type: "done" },
      ])
    )

    render(<WrappedChatWindow />)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enroll me" }))
    })

    await waitFor(() => screen.getByRole("button", { name: /cancel enrollment/i }))
    fireEvent.click(screen.getByRole("button", { name: /cancel enrollment/i }))

    await waitFor(() => {
      expect(screen.getByText(/enrollment cancelled/i)).toBeInTheDocument()
    })
  })
})

describe("ChatWindow — wizard confirm and navigate", () => {
  it("calls POST /api/enrollments and navigates on successful submission", async () => {
    const push = vi.fn()

    vi.doMock("next/navigation", () => ({
      useRouter:       () => ({ push }),
      useSearchParams: () => ({ get: () => null }),
    }))

    vi.stubGlobal("fetch", vi.fn())

    // First call: chat SSE → enroll_start
    vi.mocked(fetch).mockResolvedValueOnce(
      makeSseStream([
        { type: "enroll_start", full_name: "Alex Rivera", student_id: "2024-10001" },
        { type: "done" },
      ])
    )
    // Second call: POST /api/enrollments → success
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ enr_number: "ENR-00001-MN-0", status: "confirmed" }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    )

    render(<WrappedChatWindow />)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enroll me" }))
    })

    // Walk through all steps to reach review
    await waitFor(() => screen.getByTestId("enroll-step-confirm_identity"))
    fireEvent.click(screen.getByRole("button", { name: "Confirm identity" }))
    await waitFor(() => screen.getByTestId("enroll-step-student_type"))
    fireEvent.click(screen.getByRole("button", { name: "Select Regular" }))
    await waitFor(() => screen.getByTestId("enroll-step-year_level"))
    fireEvent.click(screen.getByRole("button", { name: "Select 1st Year" }))
    await waitFor(() => screen.getByTestId("enroll-step-program"))
    fireEvent.click(screen.getByRole("button", { name: "Select BSIT" }))
    await waitFor(() => screen.getByTestId("enroll-step-review"))

    // Confirm enrollment
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm Enrollment" }))
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/enrollments",
        expect.objectContaining({ method: "POST" })
      )
    })
  })
})
