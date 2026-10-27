import { NextRequest } from "next/server"
import { supabaseAdmin, supabaseReady } from "@/lib/supabase"

interface RouteParams {
  params: Promise<{ id: string }>
}

// ── DELETE /api/schedule/[id] — remove a single entry ─────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const numId = Number(id)

  if (!numId) {
    return Response.json({ error: "Invalid id" }, { status: 400 })
  }

  if (!supabaseReady) {
    // In-memory delete is handled optimistically on the client; just confirm.
    return new Response(null, { status: 204 })
  }

  const { error } = await supabaseAdmin
    .from("schedule_entries")
    .delete()
    .eq("id", numId)

  if (error) {
    return Response.json({ error: "Failed to delete entry" }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
