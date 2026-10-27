import { z } from "zod"

// ── Chat ─────────────────────────────────────────────────────────────
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(500)
})

export const AIResponseSchema = z.object({
  answer: z.string(),
  source: z.string().nullable(),
  type:   z.enum(["info", "checklist", "unknown"]),
  items:  z.array(z.string()).nullable()
})

// ── Multi-turn Gemini chat ─────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1000),
})

export const GeminiChatRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, "At least one message is required"),
})

export type ChatMessage        = z.infer<typeof ChatMessageSchema>
export type GeminiChatRequest  = z.infer<typeof GeminiChatRequestSchema>

// ── Enrollment submission ─────────────────────────────────────────────
export const EnrollmentSchema = z.object({
  full_name:     z.string().min(2).max(100),
  // Accept any non-empty student ID — format validation is handled by the server
  student_id:    z.string().min(1).max(30),
  student_type:  z.enum(["regular", "irregular"]),
  year_level:    z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"]),
  program:       z.string().min(1).max(50),
  // subject_codes is optional — irregular students are auto-assigned from curricula
  subject_codes: z.array(z.string()).optional()
})

// ── Schedule entry ────────────────────────────────────────────────────
export const ScheduleEntrySchema = z.object({
  student_id:   z.string().min(1),
  subject_code: z.string().min(1).max(20),
  subject_name: z.string().min(1).max(100),
  day:          z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
  time_start:   z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
  time_end:     z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
  room:         z.string().max(50).default(""),
  source:       z.enum(["manual", "enrollment"]).default("manual"),
})

export type ScheduleEntryRequest = z.infer<typeof ScheduleEntrySchema>

// ── Admin status update ───────────────────────────────────────────────
export const UpdateEnrollmentSchema = z.object({
  status: z.enum(["confirmed", "rejected"])
})

// ── Auth ──────────────────────────────────────────────────────────────
export const SignUpSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name:  z.string().min(1, "Last name is required"),
  email:      z.string().email("Invalid email address"),
  student_id: z.string().regex(
    /^\d{4}-\d{5}-MN-[01]$/,
    "Student ID must be in the format YYYY-NNNNN-MN-0 or YYYY-NNNNN-MN-1"
  ),
  password:   z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol"),
})

export const SignInSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// ── Inferred types ────────────────────────────────────────────────────
export type ChatRequest        = z.infer<typeof ChatRequestSchema>
export type AIResponse         = z.infer<typeof AIResponseSchema>
export type EnrollmentRequest  = z.infer<typeof EnrollmentSchema>
export type UpdateEnrollment   = z.infer<typeof UpdateEnrollmentSchema>
export type SignUpRequest       = z.infer<typeof SignUpSchema>
export type SignInRequest       = z.infer<typeof SignInSchema>
