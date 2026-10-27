"use client"

import { useState } from "react"
import { Field } from "./Field"
import { Input } from "./Input"
import { PasswordField } from "./PasswordField"
import { formatStudentId } from "@/lib/studentId"
import { rules } from "@/lib/validators"
import { supabaseBrowser } from "@/lib/supabase-browser"

type Errors = Partial<Record<"last"|"first"|"email"|"sid"|"pw", string>>

const ERR: Record<string, string> = {
  last:  "Enter your last name",
  first: "Enter your first name",
  email: "Enter a valid email",
  sid:   "Use the format 2025-12345-MN-0",
  pw:    "Min 8 chars with uppercase, lowercase, number & symbol",
}

interface SignUpFormProps {
  onGoSignIn: () => void
}

export function SignUpForm({ onGoSignIn }: SignUpFormProps) {
  const [last,  setLast]  = useState("")
  const [first, setFirst] = useState("")
  const [email, setEmail] = useState("")
  const [sid,   setSid]   = useState("")
  const [pw,    setPw]    = useState("")

  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  function checkField(k: keyof Errors, v: string) {
    const pass = rules[k](v)
    setErrors(e => ({ ...e, [k]: pass ? undefined : ERR[k] }))
    return pass
  }

  function validateAll() {
    const vals: Record<string, string> = { last, first, email, sid, pw }
    const newErrors: Errors = {}
    let allOk = true
    for (const k of ["last", "first", "email", "sid", "pw"] as (keyof Errors)[]) {
      if (!rules[k](vals[k])) { newErrors[k] = ERR[k]; allOk = false }
    }
    setErrors(newErrors)
    return allOk
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateAll()) return

    setLoading(true)
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: undefined,
        data: {
          first_name: first,
          last_name:  last,
          student_id: sid,
        },
      },
    })
    setLoading(false)

    if (error) {
      setErrors({ email: error.message })
      return
    }

    // Supabase returns data.user = null when the email already exists
    // (it doesn't return an error to prevent email enumeration)
    if (!data.user) {
      setErrors({ email: "An account with this email already exists. Please sign in instead." })
      return
    }

    // Successfully created — slide to sign-in
    setTimeout(() => onGoSignIn(), 1500)
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ margin: "auto 0", padding: "20px 0" }}>
      <h1 style={{ fontWeight: 500, fontSize: "26px", margin: "0 0 4px", textAlign: "center" }}>
        Create an account
      </h1>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", margin: "0 0 22px" }}>
        Sign up to start your enrollment
      </p>

      {/* name row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field id="last" label="Last name" error={errors.last}>
          <Input
            id="last"
            autoComplete="family-name"
            placeholder="Dela Cruz"
            value={last}
            onChange={e => setLast(e.target.value)}
            onBlur={() => checkField("last", last)}
            hasError={!!errors.last}
          />
        </Field>
        <Field id="first" label="First name" error={errors.first}>
          <Input
            id="first"
            autoComplete="given-name"
            placeholder="Juan"
            value={first}
            onChange={e => setFirst(e.target.value)}
            onBlur={() => checkField("first", first)}
            hasError={!!errors.first}
          />
        </Field>
      </div>

      <Field id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="juan@gmail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => checkField("email", email)}
          hasError={!!errors.email}
        />
      </Field>

      <Field id="sid" label="Student ID" error={errors.sid}>
        <Input
          id="sid"
          autoComplete="off"
          placeholder="2025-xxxxx-MN-0"
          maxLength={15}
          value={sid}
          onChange={e => setSid(formatStudentId(e.target.value))}
          onBlur={() => checkField("sid", sid)}
          hasError={!!errors.sid}
        />
      </Field>

      <PasswordField
        id="pw"
        label="Password"
        placeholder="Min 8 chars, A-z, 0-9, symbol"
        autoComplete="new-password"
        error={errors.pw}
        value={pw}
        onChange={setPw}
        onBlur={() => checkField("pw", pw)}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          width:        "100%",
          height:       "48px",
          border:       0,
          borderRadius: "999px",
          background:   "#f5b000",
          color:        "#3a1a00",
          font:         "600 15px Poppins, sans-serif",
          cursor:       "pointer",
          marginTop:    "8px",
          transition:   "transform .1s, background .15s",
          opacity:      loading ? 0.7 : 1,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ffd75e" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f5b000" }}
        onMouseDown={e =>  { (e.currentTarget as HTMLButtonElement).style.transform  = "scale(.98)" }}
        onMouseUp={e =>    { (e.currentTarget as HTMLButtonElement).style.transform  = "none" }}
      >
        {loading ? "Submitting…" : "Submit"}
      </button>

    </form>
  )
}
