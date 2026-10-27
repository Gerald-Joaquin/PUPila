export type StudentType      = "regular" | "irregular"
export type EnrollmentStatus = "pending" | "confirmed" | "rejected"
export type DayOfWeek        = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"

export interface ScheduleEntry {
  id:           number
  student_id:   string
  subject_code: string
  subject_name: string
  day:          DayOfWeek
  time_start:   string   // "HH:MM" 24-h
  time_end:     string   // "HH:MM" 24-h
  room:         string
  source:       "manual" | "enrollment"
}

/** A single class block on the timetable, derived from an Enrollment subject */
export interface ClassSchedule {
  subject_code: string
  subject_name: string
  units:        number
  day:          DayOfWeek | null   // null = unscheduled
  time_start:   string | null      // "HH:MM" 24-h
  time_end:     string | null
  room:         string
  instructor:   string
  status:       EnrollmentStatus   // inherited from the enrollment
  /** true when this slot overlaps another on the same day */
  conflict?:    boolean
}

export interface ScheduleResponse {
  enr_number:    string
  full_name:     string
  student_type:  StudentType
  year_level:    string
  program:       string
  semester:      string
  academic_year: string
  status:        EnrollmentStatus
  classes:       ClassSchedule[]
}

export interface Subject {
  code:       string
  name:       string
  units:      number
  year_level: string
  program:    string
}

export interface Enrollment {
  id:            number
  enr_number:    string
  full_name:     string
  student_id:    string
  student_type:  StudentType
  year_level:    string
  program:       string
  semester:      string
  academic_year: string
  status:        EnrollmentStatus
  subjects:      Subject[]
  created_at:    string
  updated_at:    string
}

// Summary shape returned by GET /api/enrollments (list) — no subjects[]
export interface EnrollmentSummary {
  enr_number:   string
  full_name:    string
  student_id:   string
  student_type: StudentType
  year_level:   string
  program:      string
  status:       EnrollmentStatus
  created_at:   string
}

export interface AIResponse {
  answer: string
  source: string | null
  type:   "info" | "checklist" | "unknown"
  items:  string[] | null
}

// ── Chat-driven enrollment wizard ────────────────────────────────────

export type EnrollStep =
  | "confirm_identity"
  | "student_type"
  | "year_level"
  | "program"
  | "review"
  | "done"

export interface EnrollContext {
  active:       boolean
  step:         EnrollStep
  full_name:    string
  student_id:   string
  student_type: StudentType | null
  year_level:   string | null
  program:      string | null
  submitting:   boolean
  error:        string | null
}
