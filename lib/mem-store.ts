/**
 * Shared in-memory store for demo mode (no Supabase).
 * Both /api/enrollments/route.ts (POST) and
 * /api/enrollments/[enr]/route.ts (GET/PATCH) use this.
 */

export interface MemRecord {
  enr_number:    string
  full_name:     string
  student_id:    string
  student_type:  "regular" | "irregular"
  year_level:    string
  program:       string
  semester:      string
  academic_year: string
  status:        string
  subjects:      { code: string; name: string; units: number }[]
  created_at:    string
  updated_at:    string
}

const store = new Map<string, MemRecord>()

export function addMemEnrollment(record: Omit<MemRecord, "updated_at">): MemRecord {
  const full: MemRecord = { ...record, updated_at: record.created_at }
  store.set(record.enr_number, full)
  return full
}

export function getMemEnrollment(enr_number: string): MemRecord | undefined {
  return store.get(enr_number)
}

export function getAllMemEnrollments(): MemRecord[] {
  return Array.from(store.values())
}

export function patchMemEnrollment(
  enr_number: string,
  status: string
): { enr_number: string; status: string; updated_at: string } | undefined {
  const record = store.get(enr_number)
  if (!record) return undefined
  record.status     = status
  record.updated_at = new Date().toISOString()
  return { enr_number: record.enr_number, status: record.status, updated_at: record.updated_at }
}
