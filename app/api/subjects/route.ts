import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

const VALID_PROGRAMS = ["BSIT", "BSCPE", "BSCS"] as const

export async function GET(req: NextRequest) {
  const programParam = req.nextUrl.searchParams.get("program")
  const program = VALID_PROGRAMS.includes(programParam as typeof VALID_PROGRAMS[number])
    ? (programParam as typeof VALID_PROGRAMS[number])
    : null

  let query = supabase
    .from("subjects")
    .select("code, name, units, year_level, program")

  if (program) {
    query = query.eq("program", program)
  }

  const { data, error } = await query.order("code")

  if (error) {
    return Response.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }

  return Response.json(data, { status: 200 })
}
