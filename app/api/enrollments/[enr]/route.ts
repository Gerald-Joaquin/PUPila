import { NextRequest } from "next/server"
import { UpdateEnrollmentSchema } from "@/lib/schemas"
import { supabase } from "@/lib/supabase"

interface RouteParams {
  params: Promise<{ enr: string }>
}

// ── GET /api/enrollments/[enr] — enrollment detail ────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { enr } = await params

  // Fetch enrollment row
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("id, enr_number, full_name, student_id, student_type, year_level, program, semester, academic_year, status, created_at, updated_at")
    .eq("enr_number", enr)
    .single()

  if (error || !enrollment) {
    return Response.json({ error: "Enrollment not found" }, { status: 404 })
  }

  // Fetch subjects for this enrollment
  const { data: subjects, error: subjError } = await supabase
    .from("enrollment_subjects")
    .select("subject_code, subject_name, units")
    .eq("enrollment_id", enrollment.id)

  if (subjError) {
    return Response.json({ error: "Failed to fetch enrollment subjects" }, { status: 500 })
  }

  const mappedSubjects = ((subjects ?? []) as { subject_code: string; subject_name: string; units: number }[]).map(s => ({
    code:  s.subject_code,
    name:  s.subject_name,
    units: s.units
  }))

  return Response.json(
    {
      enr_number:    enrollment.enr_number,
      full_name:     enrollment.full_name,
      student_id:    enrollment.student_id,
      student_type:  enrollment.student_type,
      year_level:    enrollment.year_level,
      program:       enrollment.program,
      semester:      enrollment.semester,
      academic_year: enrollment.academic_year,
      status:        enrollment.status,
      subjects:      mappedSubjects,
      created_at:    enrollment.created_at,
      updated_at:    enrollment.updated_at
    },
    { status: 200 }
  )
}

// ── PATCH /api/enrollments/[enr] — admin confirm / reject ─────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { enr } = await params

  if (req.headers.get("x-demo-role") !== "staff") {
    return Response.json({ error: "Staff access required" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = UpdateEnrollmentSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid status value" }, { status: 400 })
  }

  // Fetch the current enrollment to enforce transition rules atomically
  const { data: current, error: fetchError } = await supabase
    .from("enrollments")
    .select("enr_number, status, student_type")
    .eq("enr_number", enr)
    .single()

  if (fetchError || !current) {
    return Response.json({ error: "Enrollment not found" }, { status: 404 })
  }

  // Only pending irregular enrollments may be confirmed or rejected
  if (current.status !== "pending") {
    return Response.json(
      { error: `Cannot update an enrollment that is already ${current.status}` },
      { status: 409 }
    )
  }
  if (current.student_type !== "irregular") {
    return Response.json(
      { error: "Only irregular enrollments require manual approval" },
      { status: 409 }
    )
  }

  // Conditional UPDATE: only proceeds when the row still has status=pending AND
  // student_type=irregular at the moment the write lands, closing the race window.
  const { data: updated, error: updateError } = await supabase
    .from("enrollments")
    .update({ status: parsed.data.status })
    .eq("enr_number", enr)
    .eq("status", "pending")
    .eq("student_type", "irregular")
    .select("enr_number, status, updated_at")
    .maybeSingle()

  if (updateError) {
    return Response.json({ error: "Failed to update enrollment" }, { status: 500 })
  }

  // data is null when the conditional .eq() clauses matched zero rows —
  // another request already changed the status between our read and this write.
  if (!updated) {
    return Response.json(
      { error: "Enrollment has already been reviewed by another request" },
      { status: 409 }
    )
  }

  return Response.json(updated, { status: 200 })
}
