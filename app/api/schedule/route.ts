import { NextRequest } from "next/server"
import { ScheduleEntrySchema } from "@/lib/schemas"
import { supabase, supabaseAdmin, supabaseReady } from "@/lib/supabase"
import type { ScheduleEntry } from "@/types"

// ── In-memory schedule store ──────────────────────────────────────────
let nextScheduleId = 1
const scheduleStore: ScheduleEntry[] = []

// ── GET /api/schedule?student_id=XXXX ─────────────────────────────────
export async function GET(req: NextRequest) {
  const student_id = req.nextUrl.searchParams.get("student_id")
  if (!student_id) {
    return Response.json({ error: "student_id query param required" }, { status: 400 })
  }

  if (!supabaseReady) {
    const entries = scheduleStore.filter(e => e.student_id === student_id)
    return Response.json(entries, { status: 200 })
  }

  const { data, error } = await supabase
    .from("schedule_entries")
    .select("id, student_id, subject_code, subject_name, day, time_start, time_end, room, source")
    .eq("student_id", student_id)
    .order("day")
    .order("time_start")

  if (error) {
    return Response.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }

  return Response.json(data ?? [], { status: 200 })
}

// ── POST /api/schedule — add a single entry ───────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = ScheduleEntrySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  if (!supabaseReady) {
    const entry: ScheduleEntry = { id: nextScheduleId++, ...parsed.data }
    scheduleStore.push(entry)
    return Response.json(entry, { status: 201 })
  }

  const { data, error } = await supabaseAdmin
    .from("schedule_entries")
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return Response.json({ error: "Failed to save schedule entry" }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
