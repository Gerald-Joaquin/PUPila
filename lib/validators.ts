import { STUDENT_ID_REGEX } from "./studentId"

export const rules: Record<string, (v: string) => boolean> = {
  last:  v => v.trim().length > 0,
  first: v => v.trim().length > 0,
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  sid:   v => STUDENT_ID_REGEX.test(v),
  pw:    v => v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^a-zA-Z0-9]/.test(v),
  sid2:  v => STUDENT_ID_REGEX.test(v),
  pw2:   v => v.length > 0,
}
