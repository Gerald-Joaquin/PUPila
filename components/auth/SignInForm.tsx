"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Field } from "./Field"
import { Input } from "./Input"
import { PasswordField } from "./PasswordField"
import { ForgotPasswordModal } from "./ForgotPasswordModal"
import { formatStudentId } from "@/lib/studentId"
import { rules } from "@/lib/validators"
import { supabaseBrowser } from "@/lib/supabase-browser"

type Errors = Partial<Record<"sid2"|"pw2", string>>

const ERR: Record<string, string> = {
  sid2: "Use the format 2025-12345-MN-0",
  pw2:  "Enter your password",
}

export function SignInForm() {
  const router = useRouter()
  const [sid2, setSid2] = useState("")
  const [pw2,  setPw2]  = useState("")

  const [errors,       setErrors]       = useState<Errors>({})
  const [ok,           setOk]           = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [authErr,      setAuthErr]      = useState<string | null>(null)
  const [showForgot,   setShowForgot]   = useState(false)

  function checkField(k: keyof Errors, v: string) {
    const pass = rules[k](v)
    setErrors(e => ({ ...e, [k]: pass ? undefined : ERR[k] }))
    return pass
  }

  function validateAll() {
    const vals: Record<string, string> = { sid2, pw2 }
    const newErrors: Errors = {}
    let allOk = true
    for (const k of ["sid2", "pw2"] as (keyof Errors)[]) {
      if (!rules[k](vals[k])) { newErrors[k] = ERR[k]; allOk = false }
    }
    setErrors(newErrors)
    return allOk
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateAll()) { setOk(false); return }

    setLoading(true)
    setAuthErr(null)

    // Look up the email for this student_id from the profiles table.
    const { data: profile, error: profileErr } = await supabaseBrowser
      .from("profiles")
      .select("email, role")
      .eq("student_id", sid2)
      .maybeSingle()

    if (profileErr) {
      setLoading(false)
      setAuthErr(`DB error: ${profileErr.message} (code: ${profileErr.code})`)
      setOk(false)
      return
    }

    if (!profile?.email) {
      setLoading(false)
      setAuthErr("No account found for that Student ID.")
      setOk(false)
      return
    }

    const { error: signInErr } = await supabaseBrowser.auth.signInWithPassword({
      email:    profile.email as string,
      password: pw2,
    })

    setLoading(false)

    if (signInErr) {
      setAuthErr(signInErr.message)
      setOk(false)
    } else {
      setOk(true)
      const destination = profile.role === "admin" ? "/admin" : "/user"
      router.push(destination)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ margin: "auto 0", padding: "20px 0" }}>
      <h1 style={{ fontWeight: 500, fontSize: "26px", margin: "0 0 4px", textAlign: "center" }}>
        Welcome back
      </h1>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", margin: "0 0 22px" }}>
        Sign in with your student ID
      </p>

      <Field id="sid2" label="Student ID" error={errors.sid2}>
        <Input
          id="sid2"
          autoComplete="username"
          placeholder="2025-xxxxx-MN-0"
          maxLength={15}
          value={sid2}
          onChange={e => setSid2(formatStudentId(e.target.value))}
          onBlur={() => checkField("sid2", sid2)}
          hasError={!!errors.sid2}
        />
      </Field>

      <PasswordField
        id="pw2"
        label="Password"
        placeholder="Your password"
        autoComplete="current-password"
        error={errors.pw2}
        value={pw2}
        onChange={setPw2}
        onBlur={() => checkField("pw2", pw2)}
      />

      <button
        type="button"
        onClick={() => setShowForgot(true)}
        style={{
          display:            "block",
          textAlign:          "right",
          width:              "100%",
          fontSize:           "12px",
          margin:             "-4px 0 6px 0",
          paddingRight:       "8px",
          color:              "var(--link)",
          fontWeight:         500,
          textDecoration:     "underline",
          textUnderlineOffset:"2px",
          background:         "none",
          border:             0,
          cursor:             "pointer",
          fontFamily:         "inherit",
        }}
      >
        Forgot password?
      </button>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

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
        {loading ? "Signing in…" : "Sign in"}
      </button>

      {authErr && (
        <p style={{ textAlign: "center", color: "#c0261d", fontSize: "13px", marginTop: "12px" }}>
          {authErr}
        </p>
      )}

      {ok && (
        <p style={{ display: "block", textAlign: "center", color: "var(--link)", fontWeight: 500, fontSize: "13px", marginTop: "12px" }}>
          Credentials look good. Ready to send to your backend.
        </p>
      )}
    </form>
  )
}
