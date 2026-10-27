"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MessageCircle, X, Send, ChevronDown } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { EnrollContext } from "@/types"
import { EnrollStepRenderer } from "./EnrollStepRenderer"

interface Message {
  role:       "user" | "assistant"
  content:    string
  enrollStep?: boolean
}

const CHIPS = [
  "Enroll me",
  "How do I enroll?",
  "Regular vs Irregular",
  "Required documents",
  "Track my status",
  "When is enrollment?",
]

const INIT_ENROLL_CTX: EnrollContext = {
  active:       false,
  step:         "confirm_identity",
  full_name:    "",
  student_id:   "",
  student_type: null,
  year_level:   null,
  program:      null,
  submitting:   false,
  error:        null,
}

/** Inner component that can safely use useSearchParams */
function ChatBubbleInner() {
  const searchParams = useSearchParams()
  const [open,       setOpen]       = useState(false)
  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState("")
  const [loading,    setLoading]    = useState(false)
  const [chipsShown, setChipsShown] = useState(true)
  const [enrollCtx,  setEnrollCtx]  = useState<EnrollContext>(INIT_ENROLL_CTX)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const sessionToken = useRef<string | null>(null)
  const autoFired    = useRef(false)

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      sessionToken.current = data.session?.access_token ?? null
    })
  }, [])

  // Auto-open + trigger enrollment wizard from ?action=enroll
  useEffect(() => {
    if (autoFired.current) return
    if (searchParams.get("action") === "enroll") {
      autoFired.current = true
      setOpen(true)
      setTimeout(() => sendText("Enroll me"), 400)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  function cancelWizard() {
    setEnrollCtx(INIT_ENROLL_CTX)
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: "Enrollment cancelled. Feel free to ask me anything!" },
    ])
  }

  async function handleStepSelect(value: string) {
    const ctx = enrollCtx

    if (ctx.step === "confirm_identity") {
      if (value === "confirmed") {
        setMessages(prev => [
          ...prev,
          { role: "user",      content: "Yes, that's me" },
          { role: "assistant", content: "Great! Are you enrolling as a Regular or Irregular student?", enrollStep: true },
        ])
        setEnrollCtx(prev => ({ ...prev, step: "student_type" }))
      }
      return
    }
    if (ctx.step === "student_type") {
      const studentType = value as "regular" | "irregular"
      setMessages(prev => [
        ...prev,
        { role: "user",      content: studentType === "regular" ? "Regular" : "Irregular" },
        { role: "assistant", content: "Got it! What year level are you enrolling for?", enrollStep: true },
      ])
      setEnrollCtx(prev => ({ ...prev, student_type: studentType, step: "year_level" }))
      return
    }
    if (ctx.step === "year_level") {
      setMessages(prev => [
        ...prev,
        { role: "user",      content: value },
        { role: "assistant", content: "Which program are you enrolled in?", enrollStep: true },
      ])
      setEnrollCtx(prev => ({ ...prev, year_level: value, step: "program" }))
      return
    }
    if (ctx.step === "program") {
      const typeLabel = ctx.student_type === "irregular" ? "Irregular" : "Regular"
      setMessages(prev => [
        ...prev,
        { role: "user", content: value },
        {
          role:       "assistant",
          content:    ctx.student_type === "irregular"
            ? `Got it! As an Irregular student, I'll automatically assign your subjects from ${ctx.year_level} and the year below. Here's your enrollment summary — ready to submit?`
            : "Here's your enrollment summary — ready to submit?",
          enrollStep: true,
        },
      ])
      setEnrollCtx(prev => ({ ...prev, program: value, step: "review" }))
      return
    }
  }

  async function handleConfirm() {
    const ctx = enrollCtx
    setEnrollCtx(prev => ({ ...prev, submitting: true, error: null }))
    try {
      const body: Record<string, unknown> = {
        full_name:    ctx.full_name,
        student_id:   ctx.student_id,
        student_type: ctx.student_type,
        year_level:   ctx.year_level,
        program:      ctx.program,
        // No subject_codes — server auto-assigns for both regular and irregular
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (sessionToken.current) headers["Authorization"] = `Bearer ${sessionToken.current}`
      const res  = await fetch("/api/enrollments", { method: "POST", headers, body: JSON.stringify(body) })
      const data = await res.json() as { enr_number?: string; status?: string; error?: string }
      if (!res.ok) {
        setEnrollCtx(prev => ({ ...prev, submitting: false, error: data.error ?? "Enrollment failed." }))
        return
      }
      // Navigate to success page
      window.location.href = `/user/success?enr=${encodeURIComponent(data.enr_number ?? "")}&status=${data.status ?? "pending"}`
    } catch {
      setEnrollCtx(prev => ({ ...prev, submitting: false, error: "Network error. Please try again." }))
    }
  }

  async function sendText(text: string) {
    if (!text.trim() || loading) return
    setInput("")
    setChipsShown(false)

    const nextMessages: Message[] = [...messages, { role: "user", content: text.trim() }]
    setMessages(nextMessages)
    setLoading(true)

    let accumulated = ""

    try {
      const chatHeaders: Record<string, string> = { "Content-Type": "application/json" }
      if (sessionToken.current) chatHeaders["Authorization"] = `Bearer ${sessionToken.current}`

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: chatHeaders,
        body:    JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: true })
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === "enroll_start") {
              const full_name  = (event.full_name  as string) || ""
              const student_id = (event.student_id as string) || ""
              setEnrollCtx({
                ...INIT_ENROLL_CTX,
                active:     true,
                step:       "confirm_identity",
                full_name,
                student_id,
              })
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role:       "assistant",
                  content:    "Let's get you enrolled! First, let me confirm your details.",
                  enrollStep: true,
                }
                return updated
              })
              continue
            }

            if (event.type === "chunk" && event.text) {
              accumulated += event.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: "assistant", content: accumulated }
                return updated
              })
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Floating modal ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width:      "360px",
            height:     "520px",
            background: "#ffffff",
            border:     "1px solid #eadfd8",
            boxShadow:  "0 8px 40px rgba(155,27,27,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {/* Header — matches sidebar gradient */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ background: "linear-gradient(135deg, #9B1B1B 0%, #6E0A0E 100%)" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </span>
              <span className="font-bold text-[14px] text-white tracking-wide">
                CampusAssist AI
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)" }}
              aria-label="Close chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages — cream background */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" style={{ background: "#fbf8f5" }}>
            {messages.length === 0 && (
              <p className="text-center text-xs mt-4" style={{ color: "#74635e" }}>
                Ask me anything about enrollment.
              </p>
            )}
            {(() => {
              const lastEnrollStepIdx = messages.reduceRight(
                (found, msg, idx) => (found === -1 && msg.enrollStep ? idx : found),
                -1
              )
              return messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "#9B1B1B", color: "#ffffff", borderTopRightRadius: "4px", maxWidth: "84%" }
                        : { background: "#ffffff", color: "#2b1716", borderTopLeftRadius: "4px", border: "1px solid #eadfd8", maxWidth: "92%" }
                    }
                  >
                    {msg.content}
                    {msg.enrollStep && i === lastEnrollStepIdx && enrollCtx.active && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid #eadfd8" }}>
                        <EnrollStepRenderer
                          ctx={enrollCtx}
                          onSelect={handleStepSelect}
                          onSubjectChange={codes => setEnrollCtx(prev => ({ ...prev, subject_codes: codes }))}
                          onConfirm={handleConfirm}
                          onCancel={cancelWizard}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            })()}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-3.5 py-2.5 rounded-2xl"
                  style={{ background: "#ffffff", border: "1px solid #eadfd8", borderTopLeftRadius: "4px" }}
                >
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: "#74635e" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: "#74635e" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#74635e" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area — white card */}
          <div
            className="shrink-0 px-4 pb-4 pt-3"
            style={{ borderTop: "1px solid #eadfd8", background: "#ffffff" }}
          >
            {enrollCtx.active ? (
              /* Wizard active: show cancel link only */
              <div className="flex justify-center py-1">
                <button
                  onClick={cancelWizard}
                  className="text-[11px] underline underline-offset-2 transition-colors"
                  style={{ color: "#74635e" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9B1B1B" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#74635e" }}
                >
                  Cancel enrollment
                </button>
              </div>
            ) : (
              <>
                {/* Chips */}
                {chipsShown && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {CHIPS.map(chip => (
                      <button
                        key={chip}
                        onClick={() => sendText(chip)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors disabled:opacity-40"
                        style={{
                          background: "#f9e9e5",
                          border:     "1px solid #eadfd8",
                          color:      "#74635e",
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.borderColor = "#9B1B1B"
                          el.style.color       = "#9B1B1B"
                          el.style.background  = "#f9e9e5"
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.borderColor = "#eadfd8"
                          el.style.color       = "#74635e"
                          el.style.background  = "#f9e9e5"
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Text input row */}
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
                  style={{ background: "#fbf8f5", border: "1px solid #eadfd8" }}
                >
                  <input
                    className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-[#74635e]/60"
                    style={{ color: "#2b1716" }}
                    placeholder="Ask something about enrollment…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendText(input.trim())}
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendText(input.trim())}
                    disabled={loading || !input.trim()}
                    aria-label="Send"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-30 active:scale-95 transition-all shrink-0"
                    style={{ background: "#9B1B1B" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bubble button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Assistant"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95"
        style={{
          background: "linear-gradient(135deg, #9B1B1B 0%, #6E0A0E 100%)",
          boxShadow:  "0 0 0 3px rgba(155,27,27,0.35), 0 4px 20px rgba(155,27,27,0.45)",
        }}
      >
        {open
          ? <ChevronDown className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />
        }
      </button>
    </>
  )
}

/** Public export wrapped in Suspense so useSearchParams is safe */
export function ChatBubble() {
  return (
    <Suspense fallback={null}>
      <ChatBubbleInner />
    </Suspense>
  )
}
