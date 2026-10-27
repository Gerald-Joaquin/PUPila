import { NextRequest } from "next/server"
import { EnrollmentSchema } from "@/lib/schemas"
import {
  supabaseAdmin,
  supabaseReady,
  verifyToken,
  isAdminUser,
} from "@/lib/supabase"
import { generateEnrNumber } from "@/lib/utils"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { addMemEnrollment, getAllMemEnrollments } from "@/lib/mem-store"

type Subject = { code: string; name: string; units: number }

// ── Demo next id counter ──────────────────────────────────────────────
let nextId = 100

// ── Year level ordering — used to find "one year below" ──────────────
const YEAR_ORDER = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

/** Return the year level one step below the given one (null if already 1st Year) */
function yearBelow(yearLevel: string): string | null {
  const idx = YEAR_ORDER.indexOf(yearLevel)
  return idx > 0 ? YEAR_ORDER[idx - 1] : null
}

// ── Fallback curriculum (used when Supabase has no data) ──────────────
const DEMO_SUBJECTS: Record<string, Subject[]> = {
  "1st Year": [
    { code: "GEN101",  name: "General Education 1", units: 3 },
    { code: "GEN102",  name: "General Education 2", units: 3 },
    { code: "CORE101", name: "Core Subject 1",      units: 3 },
  ],
  "2nd Year": [
    { code: "CORE201", name: "Core Subject 2", units: 3 },
    { code: "CORE202", name: "Core Subject 3", units: 3 },
    { code: "ELEC201", name: "Elective 1",     units: 3 },
  ],
  "3rd Year": [
    { code: "CORE301", name: "Core Subject 4", units: 3 },
    { code: "CORE302", name: "Core Subject 5", units: 3 },
    { code: "ELEC301", name: "Elective 2",     units: 3 },
  ],
  "4th Year": [
    { code: "CAPS401", name: "Capstone Project 1", units: 3 },
    { code: "CAPS402", name: "Capstone Project 2", units: 3 },
    { code: "ELEC401", name: "Elective 3",         units: 3 },
  ],
}

// ── GET /api/enrollments — admin list ─────────────────────────────────
const VALID_STATUSES = ["pending", "confirmed", "rejected"] as const

export async function GET(req: NextRequest) {
  try {
    const statusParam = req.nextUrl.searchParams.get("status")

    if (!supabaseReady) {
      // In-memory fallback — accept x-demo-role header for dev convenience
      if (req.headers.get("x-demo-role") !== "staff") {
        return Response.json({ error: "Staff access required" }, { status: 403 })
      }
      const all = getAllMemEnrollments()
      const rows = statusParam ? all.filter(e => e.status === statusParam) : all
      return Response.json([...rows].reverse(), { status: 200 })
    }

    // Accept x-demo-role: staff OR a verified admin JWT
    const isDemoStaff = req.headers.get("x-demo-role") === "staff"
    const admin = isDemoStaff || await isAdminUser(req.headers.get("authorization"))
    if (!admin) {
      return Response.json({ error: "Staff access required" }, { status: 403 })
    }

    const validStatus = VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number])
      ? (statusParam as typeof VALID_STATUSES[number])
      : null

    // Admin client bypasses RLS — can read all rows
    let query = supabaseAdmin
      .from("enrollments")
      .select("enr_number, full_name, student_id, student_type, year_level, program, status, created_at")

    if (validStatus) query = query.eq("status", validStatus)

    const { data, error } = await query.order("created_at", { ascending: false })
    if (error) {
      console.error("GET /api/enrollments error:", error)
      return Response.json({ error: "Failed to fetch enrollments" }, { status: 500 })
    }
    return Response.json(data, { status: 200 })
  } catch (err) {
    console.error("GET /api/enrollments failed:", err)
    return Response.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}

// ── POST /api/enrollments — submit enrollment ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(req)
    const limit = rateLimit(ip, { limit: 10, windowMs: 60_000 })
    if (!limit.allowed) {
      return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 })
    }

    // Parse body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate
    const parsed = EnrollmentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { full_name, student_id, student_type, year_level, program, subject_codes } = parsed.data

    // PATH A: Supabase is configured
    if (supabaseReady) {
      // Verify the student's JWT — required so we can store user_id and enforce RLS
      const user = await verifyToken(req.headers.get("authorization"))
      if (!user) {
        return Response.json({ error: "Authentication required. Please sign in to enroll." }, { status: 401 })
      }
      return await handleWithSupabase({
        full_name, student_id, student_type, year_level, program, subject_codes,
        user_id: user.id,
      })
    }

    // PATH B: Demo / no Supabase, in-memory store
    const id         = nextId++
    const enr_number = generateEnrNumber(id, student_type)
    const status     = student_type === "regular" ? "confirmed" : "pending"

    let subjects: Subject[]
    if (student_type === "regular") {
      subjects = DEMO_SUBJECTS[year_level] ?? DEMO_SUBJECTS["1st Year"]
    } else {
      // Irregular: auto-assign from current year + one year below
      const current = DEMO_SUBJECTS[year_level] ?? []
      const below   = yearBelow(year_level) ? (DEMO_SUBJECTS[yearBelow(year_level)!] ?? []) : []
      subjects = [...current, ...below]
    }

    addMemEnrollment({
      enr_number,
      full_name,
      student_id,
      student_type,
      year_level,
      program,
      semester:      "1st Semester",
      academic_year: "2025-2026",
      status,
      subjects,
      created_at: new Date().toISOString(),
    })

    return Response.json({ enr_number, status, subjects }, { status: 201 })
  } catch (err) {
    console.error("POST /api/enrollments failed:", err)
    return Response.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}

// ── Supabase path (only called when credentials exist) ────────────────
async function handleWithSupabase(data: {
  full_name:      string
  student_id:     string
  student_type:   "regular" | "irregular"
  year_level:     string
  program:        string
  subject_codes?: string[]
  user_id:        string
}): Promise<Response> {
  const { full_name, student_id, student_type, year_level, program, subject_codes, user_id } = data
  const status = student_type === "regular" ? "confirmed" : "pending"

  // 1. Insert with placeholder enr_number.
  // Admin client (service-role key) bypasses RLS, so the insert succeeds
  // even though user_id must match for the eventual student-read RLS policy.
  const { data: enrollment, error: insertError } = await supabaseAdmin
    .from("enrollments")
    .insert({
      enr_number: crypto.randomUUID(),
      full_name,
      student_id,
      student_type,
      year_level,
      program,
      status,
      user_id,           // store verified user_id for RLS ownership
    })
    .select("id")
    .single()

  if (insertError || !enrollment) {
    console.error("Insert error:", insertError)
    // 23505 = unique violation (duplicate student_id)
    if (insertError?.code === "23505") {
      return Response.json({ error: "This Student ID already has an enrollment." }, { status: 409 })
    }
    return Response.json(
      { error: `Failed to create enrollment: ${insertError?.message ?? "unknown"}` },
      { status: 500 }
    )
  }

  // 2. Set real enr_number
  const enr_number = generateEnrNumber(enrollment.id, student_type)
  const { error: updateError } = await supabaseAdmin
    .from("enrollments")
    .update({ enr_number })
    .eq("id", enrollment.id)

  if (updateError) {
    console.error("Update enr_number error:", updateError)
    await supabaseAdmin.from("enrollments").delete().eq("id", enrollment.id)
    return Response.json({ error: "Failed to create enrollment" }, { status: 500 })
  }

  // 3. Resolve subjects
  let resolvedSubjects: Subject[] = []

  if (student_type === "regular") {
    const { data: curricula } = await supabaseAdmin
      .from("curricula")
      .select("subject_code, subject_name, units")
      .eq("year_level", year_level)
      .eq("program", program)

    if (curricula && curricula.length > 0) {
      resolvedSubjects = curricula.map(
        (c: { subject_code: string; subject_name: string; units: number }) => ({
          code: c.subject_code, name: c.subject_name, units: c.units,
        })
      )
    } else {
      resolvedSubjects = DEMO_SUBJECTS[year_level] ?? DEMO_SUBJECTS["1st Year"]
    }
  } else {
    // Irregular: auto-assign subjects from current year level + one year below
    const below = yearBelow(year_level)
    const yearLevelsToFetch = below ? [year_level, below] : [year_level]

    const { data: curricula, error: currErr } = await supabaseAdmin
      .from("curricula")
      .select("subject_code, subject_name, units")
      .eq("program", program)
      .in("year_level", yearLevelsToFetch)

    if (currErr || !curricula || curricula.length === 0) {
      // Fallback to demo subjects
      const current = DEMO_SUBJECTS[year_level] ?? []
      const belowSubjects = below ? (DEMO_SUBJECTS[below] ?? []) : []
      resolvedSubjects = [...current, ...belowSubjects]
    } else {
      resolvedSubjects = (curricula as { subject_code: string; subject_name: string; units: number }[])
        .map(c => ({ code: c.subject_code, name: c.subject_name, units: c.units }))
    }
  }

  // 4. Insert enrollment_subjects (log the error, but don't fail the enrollment)
  if (resolvedSubjects.length > 0) {
    const { error: subjInsertErr } = await supabaseAdmin.from("enrollment_subjects").insert(
      resolvedSubjects.map(s => ({
        enrollment_id: enrollment.id,
        subject_code:  s.code,
        subject_name:  s.name,
        units:         s.units,
      }))
    )
    if (subjInsertErr) console.error("enrollment_subjects insert failed:", subjInsertErr)
  }

  return Response.json({ enr_number, status, subjects: resolvedSubjects }, { status: 201 })
}