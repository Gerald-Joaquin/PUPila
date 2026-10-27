"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Send } from "lucide-react"
import { ChecklistCard } from "./ChecklistCard"
import { EnrollStepRenderer } from "./EnrollStepRenderer"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { AIResponse, EnrollContext } from "@/types"

interface Message {
  role:    "user" | "assistant"
  content: string
  ai?:     AIResponse
  /** when set, renders an EnrollStepRenderer inside the assistant bubble */
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

export function ChatWindow() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [messages, setMessages] = useState<Message[]>([
    {
      role:    "assistant",
      content: "Hi! I'm CampusAssist AI. Ask me anything about the enrollment process.",
      ai:      { answer: "Hi! I'm CampusAssist AI. Ask me anything about the enrollment process.", source: null, type: "info", items: null },
    },
  ])
  const [input,      setInput]      = useState("")
  const [loading,    setLoading]    = useState(false)
  const [chipsShown, setChipsShown] = useState(true)
  const [enrollCtx,  setEnrollCtx]  = useState<EnrollContext>(INIT_ENROLL_CTX)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const sessionToken = useRef<string | null>(null)
  const autoFired    = useRef(false)

  // ── Fetch session token on mount ─────────────────────────────────
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      sessionToken.current = data.session?.access_token ?? null
    })
  }, [])

  // ── Auto-trigger enrollment wizard from ?action=enroll ───────────
  useEffect(() => {
    if (autoFired.current) return
    if (searchParams.get("action") === "enroll") {
      autoFired.current = true
      // Small delay so the greeting message renders first
      setTimeout(() => sendText("Enroll me"), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /** Cancel the enrollment wizard and return to normal chat */
  function cancelWizard() {
    setEnrollCtx(INIT_ENROLL_CTX)
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: "Enrollment cancelled. Feel free to ask me anything!" },
    ])
  }

  /**
   * Advance the wizard one step based on the user's selection.
   * `value` is the raw option selected (e.g. "regular", "2nd Year", "BSIT", "continue", "confirmed").
   */
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
      // "cancelled" handled by onCancel → cancelWizard()
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

  /** Fire POST /api/enrollments and navigate to /user/success on success */
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
      if (sessionToken.current) {
        headers["Authorization"] = `Bearer ${sessionToken.current}`
      }

      const res  = await fetch("/api/enrollments", {
        method:  "POST",
        headers,
        body:    JSON.stringify(body),
      })
      const data = await res.json() as { enr_number?: string; status?: string; error?: string }

      if (!res.ok) {
        setEnrollCtx(prev => ({ ...prev, submitting: false, error: data.error ?? "Enrollment failed. Please try again." }))
        return
      }

      // Navigate to the success page — same as the form flow
      router.push(`/user/success?enr=${encodeURIComponent(data.enr_number ?? "")}&status=${data.status ?? "pending"}`)
    } catch {
      setEnrollCtx(prev => ({ ...prev, submitting: false, error: "Network error. Please try again." }))
    }
  }

  async function sendText(text: string) {
    if (!text || loading) return
    setInput("")
    setChipsShown(false)

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ]
    setMessages(nextMessages)
    setLoading(true)

    // Accumulate streamed chunks into a single assistant message
    let accumulated = ""

    try {
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (sessionToken.current) {
        authHeaders["Authorization"] = `Bearer ${sessionToken.current}`
      }

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: authHeaders,
        body:    JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()

      // Add a placeholder assistant message to stream into
      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: true })
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6))

            // ── Enrollment wizard start ─────────────────────────────
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
              // Replace the placeholder with the identity-confirm step message
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role:        "assistant",
                  content:     "Let's get you enrolled! First, let me confirm your details.",
                  enrollStep:  true,
                }
                return updated
              })
              continue
            }

            if (event.type === "chunk" && event.text) {
              accumulated += event.text
              // Update the last assistant message in place
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: "assistant", content: accumulated }
                return updated
              })
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: "Something went wrong. Please try again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  // Index of the LAST enrollStep message — that's where the live wizard renders
  const lastEnrollStepIdx = messages.reduceRight(
    (found, msg, idx) => (found === -1 && msg.enrollStep ? idx : found),
    -1
  )

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-[#9B1B1B]/10 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <svg className="w-3.5 h-3.5 text-[#9B1B1B]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/>
                </svg>
              </div>
            )}
            <div className="max-w-[90%]">
              {msg.role === "user" ? (
                <div className="bg-[#9B1B1B] text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-[13px] leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-[13px] text-gray-800 leading-relaxed shadow-sm">
                    {msg.content}
                    {msg.ai?.source && msg.ai.type !== "checklist" && (
                      <p className="text-[11px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100">
                        Source: {msg.ai.source}
                      </p>
                    )}
                    {/* Render the active wizard step inside the last enrollStep bubble */}
                    {msg.enrollStep && i === lastEnrollStepIdx && enrollCtx.active && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
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
                  {msg.ai?.type === "checklist" && msg.ai.items && (
                    <ChecklistCard items={msg.ai.items} source={msg.ai.source} />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#9B1B1B]/10 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-[#9B1B1B]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/>
              </svg>
            </div>
            <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
              {/* Three-dot loader */}
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"/>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"/>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"/>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-[#FAFAFA]">

        {/* Wizard active: show cancel link instead of chips + input */}
        {enrollCtx.active ? (
          <div className="flex justify-center py-1">
            <button
              onClick={cancelWizard}
              className="text-[11px] text-gray-400 hover:text-[#9B1B1B] transition-colors underline underline-offset-2"
            >
              Cancel enrollment
            </button>
          </div>
        ) : (
          <>
            {/* Suggestion chips — shown until first message sent */}
            {chipsShown && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => sendText(chip)}
                    disabled={loading}
                    className="px-3 py-1 rounded-full text-[11px] font-medium border transition-colors disabled:opacity-40"
                    style={{
                      background:   "#fff",
                      borderColor:  "#e5e7eb",
                      color:        "#374151",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#9B1B1B"; (e.currentTarget as HTMLButtonElement).style.color = "#9B1B1B" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.color = "#374151" }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-[#9B1B1B]/40 focus-within:ring-2 focus-within:ring-[#9B1B1B]/10 transition-all">
              <input
                className="flex-1 text-[13px] outline-none placeholder:text-gray-400 bg-transparent text-gray-800"
                placeholder="Ask AI…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendText(input.trim())}
                disabled={loading}
              />
              <button
                onClick={() => sendText(input.trim())}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#9B1B1B] text-white disabled:opacity-30 hover:bg-[#7a1515] active:scale-95 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Answers from curated enrollment content only
            </p>
          </>
        )}
      </div>
    </div>
  )
}
