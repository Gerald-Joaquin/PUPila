/**
 * app/api/chat/route.ts
 *
 * POST /api/chat
 * Accepts: { messages: [{ role, content }] }
 * Returns: Server-Sent Events (text/event-stream)
 *   data: { type: "chunk", text: string }
 *   data: { type: "done" }
 *   data: { type: "error", message: string }
 */

import { NextRequest } from "next/server"
import { GeminiChatRequestSchema } from "@/lib/schemas"
import { geminiReady, streamGeminiResponse, buildConfig, GEMINI_TOOLS } from "@/lib/gemini"
import { buildSystemInstruction } from "@/lib/chat-prompt"
import { classifyMessage } from "@/lib/chat-classifier"
import { getAIResponse } from "@/lib/ai"
import { supabase, supabaseAdmin, supabaseReady } from "@/lib/supabase"
import { getMemEnrollment } from "@/lib/mem-store"
import type { Content, GenerateContentConfig } from "@google/genai"

// ── Rate limiting (per-IP, in-memory) ────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 15      // requests per window
const RATE_WINDOW   = 60_000  // 1 minute in ms

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

function rateLimit(ip: string): boolean {
  const now    = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) return false
  record.count++
  return true
}

// ── ENR number regex ──────────────────────────────────────────────────
const ENR_REGEX = /ENR-\d{5}-[A-Z]{2}-[01]/i

// ── SSE helper ────────────────────────────────────────────────────────
const encoder = new TextEncoder()
function sseChunk(data: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

// ── Fixed off-topic reply stream ──────────────────────────────────────
function offTopicStream(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sseChunk({
        type: "chunk",
        text: "I can only help with enrollment, schedules, subjects and tracking. Is there something about your enrollment I can help with?",
      }))
      controller.enqueue(sseChunk({ type: "done" }))
      controller.close()
    },
  })
}

// ── Keyword-only fallback (when GEMINI_API_KEY is missing) ────────────
function keywordFallbackStream(message: string): ReadableStream<Uint8Array> {
  const aiResp = getAIResponse(message)
  const text   = aiResp.type !== "unknown"
    ? aiResp.answer
    : "I'm sorry, I don't have information about that right now. Please contact the Registrar's Office or Enrollment Office for assistance."

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sseChunk({ type: "chunk", text }))
      controller.enqueue(sseChunk({ type: "done" }))
      controller.close()
    },
  })
}

// ── Tool execution ────────────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // ── get_enrollment_status ────────────────────────────────────────
  if (name === "get_enrollment_status") {
    const enr = String(args.enr_number ?? "").trim().toUpperCase()

    if (!ENR_REGEX.test(enr)) {
      return { error: "No enrollment found for that ENR number" }
    }

    if (supabaseReady) {
      const { data: enrollment, error } = await supabaseAdmin
        .from("enrollments")
        .select("id, enr_number, status, student_type, year_level, program")
        .eq("enr_number", enr)
        .single()

      if (error || !enrollment) {
        return { error: "No enrollment found for that ENR number" }
      }

      const { data: subjects } = await supabase
        .from("enrollment_subjects")
        .select("subject_code, subject_name, units")
        .eq("enrollment_id", enrollment.id)

      return {
        enr_number:   enrollment.enr_number,
        status:       enrollment.status,
        student_type: enrollment.student_type,
        year_level:   enrollment.year_level,
        program:      enrollment.program,
        subjects:     (subjects ?? []).map((s: { subject_code: string; subject_name: string; units: number }) => ({
          code:  s.subject_code,
          name:  s.subject_name,
          units: s.units,
        })),
      }
    }

    // Fallback: in-memory store
    const record = getMemEnrollment(enr)
    if (!record) return { error: "No enrollment found for that ENR number" }

    return {
      enr_number:   record.enr_number,
      status:       record.status,
      student_type: record.student_type,
      year_level:   record.year_level,
      program:      record.program,
      subjects:     record.subjects,
    }
  }

  // ── get_subjects ─────────────────────────────────────────────────
  if (name === "get_subjects") {
    const yearLevel = String(args.year_level ?? "")
    const program   = String(args.program ?? "")

    if (supabaseReady) {
      const { data, error } = await supabase
        .from("curricula")
        .select("subject_code, subject_name, units")
        .eq("year_level", yearLevel)
        .eq("program", program)

      if (error || !data || data.length === 0) {
        return { subjects: [], note: "No subjects found for that year level and program." }
      }

      return {
        year_level: yearLevel,
        program,
        subjects: data.map((s: { subject_code: string; subject_name: string; units: number }) => ({
          code:  s.subject_code,
          name:  s.subject_name,
          units: s.units,
        })),
      }
    }

    // Demo fallback
    const DEMO_SUBJECTS: Record<string, { code: string; name: string; units: number }[]> = {
      "1st Year": [
        { code: "IT101", name: "Introduction to Computing",       units: 3 },
        { code: "IT102", name: "Computer Programming 1",          units: 3 },
        { code: "IT103", name: "Mathematics in the Modern World", units: 3 },
      ],
      "2nd Year": [
        { code: "IT201", name: "Data Structures and Algorithms",  units: 3 },
        { code: "IT202", name: "Object-Oriented Programming",     units: 3 },
        { code: "IT203", name: "Database Management Systems",     units: 3 },
      ],
      "3rd Year": [
        { code: "IT301", name: "Web Systems and Technologies",    units: 3 },
        { code: "IT302", name: "Networks and Communications",     units: 3 },
      ],
      "4th Year": [
        { code: "IT401", name: "Capstone Project 1",              units: 3 },
        { code: "IT402", name: "Software Engineering",            units: 3 },
      ],
    }

    return {
      year_level: yearLevel,
      program,
      subjects:   DEMO_SUBJECTS[yearLevel] ?? [],
    }
  }

  // ── get_schedule ─────────────────────────────────────────────────
  if (name === "get_schedule") {
    const enr = String(args.enr_number ?? "").trim().toUpperCase()

    if (!ENR_REGEX.test(enr)) {
      return { error: "No enrollment found for that ENR number" }
    }

    if (supabaseReady) {
      const { data: enrollment } = await supabaseAdmin
        .from("enrollments")
        .select("id, student_id")
        .eq("enr_number", enr)
        .single()

      if (!enrollment) return { error: "No enrollment found for that ENR number" }

      const { data: schedule } = await supabase
        .from("schedule_entries")
        .select("subject_code, subject_name, day, time_start, time_end, room")
        .eq("student_id", enrollment.student_id)

      return {
        enr_number: enr,
        schedule:   schedule ?? [],
      }
    }

    return { enr_number: enr, schedule: [], note: "Schedule not available in demo mode." }
  }

  return { error: `Unknown tool: ${name}` }
}

// ── SSE response headers ──────────────────────────────────────────────
const SSE_HEADERS = {
  "Content-Type":  "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection":    "keep-alive",
}

// ── Route handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Rate limit ───────────────────────────────────────────────────
  const ip = getClientIp(req)
  if (!rateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  // ── Parse and validate body ──────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const parsed = GeminiChatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const { messages } = parsed.data

  // ── Enrollment intent — handled before Gemini check (no LLM needed) ─
  // classifyMessage uses fast-path regex for "Enroll me" / "enroll" so
  // this works even when GEMINI_API_KEY is not configured.
  const enrollCheck = await classifyMessage(messages)
  if (enrollCheck === "enroll") {
    let full_name  = ""
    let student_id = ""

    const authHeader = req.headers.get("Authorization") ?? ""
    const token      = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (token && supabaseReady) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(token)
        if (data.user) {
          full_name  = data.user.user_metadata?.full_name  ?? data.user.email ?? "Student"
          student_id = data.user.user_metadata?.student_id ?? ""
        }
      } catch {
        // fall through with empty strings — wizard handles it gracefully
      }
    }

    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(sseChunk({ type: "enroll_start", full_name, student_id }))
          controller.enqueue(sseChunk({ type: "done" }))
          controller.close()
        },
      }),
      { headers: SSE_HEADERS }
    )
  }

  // ── Keyword fallback when Gemini is not configured ───────────────
  if (!geminiReady) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? ""
    return new Response(keywordFallbackStream(lastUserMessage), { headers: SSE_HEADERS })
  }

  // ── Reuse the route already classified above ─────────────────────
  const route = enrollCheck

  // TEMPORARY — remove after verifying routes in the terminal
  console.log(`[chat] route → ${route}`)

  // ── off_topic: return fixed reply without calling the main model ──
  if (route === "off_topic") {
    return new Response(offTopicStream(), { headers: SSE_HEADERS })
  }

  // ── Build Gemini config based on route ───────────────────────────
  try {
    const systemInstruction = buildSystemInstruction()
    const baseConfig        = buildConfig(systemInstruction)

    // knowledge: no tools — the model must answer from the system instruction only
    // live_data: full tools — the model can call get_enrollment_status etc.
    const config: GenerateContentConfig =
      route === "knowledge"
        ? { ...baseConfig, tools: undefined }
        : { ...baseConfig, tools: GEMINI_TOOLS }

    const contents: Content[] = messages.map((m) => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const stream = await streamGeminiResponse(contents, config, executeTool)

    return new Response(stream, { headers: SSE_HEADERS })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[/api/chat] Gemini error, falling back to keyword matcher:", msg)

    // Fall back to keyword matcher rather than returning an error to the browser
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? ""
    return new Response(keywordFallbackStream(lastUserMessage), { headers: SSE_HEADERS })
  }
}
