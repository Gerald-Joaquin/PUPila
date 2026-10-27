export const STUDENT_ID_REGEX = /^\d{4}-\d{5}-MN-\d$/i

export function formatStudentId(value: string): string {
  const d = value.replace(/\D/g, "")
  let out = d.slice(0, 4)
  if (d.length > 4) out += "-" + d.slice(4, 9)
  if (d.length >= 9) {
    out += "-MN"
    if (d.length > 9) out += "-" + d.slice(9, 10)
  }
  return out
}
