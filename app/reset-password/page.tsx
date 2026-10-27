"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { PageBackground } from "@/components/auth/PageBackground"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)
  const [ready,     setReady]     = useState(false)

  // Supabase puts the recovery token in the URL hash — exchange it for a session
  useEffect(() => {
    supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
  }, [])

  function validate() {
    if (password.length < 8)                          return "Password must be at least 8 characters."
    if (!/[a-z]/.test(password))                      return "Password must contain a lowercase letter."
    if (!/[A-Z]/.test(password))                      return "Password must contain an uppercase letter."
    if (!/[0-9]/.test(password))                      return "Password must contain a number."
    if (!/[^a-zA-Z0-9]/.test(password))               return "Password must contain a symbol."
    if (password !== confirm)                          return "Passwords do not match."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)

    const { error: err } = await supabaseBrowser.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setDone(true)
      setTimeout(() => router.push("/auth"), 2000)
    }
  }

  const inputStyle: React.CSSProperties = {
    width:        "100%",
    height:       "44px",
    border:       "1.5px solid transparent",
    background:   "var(--field)",
    color:        "var(--ink)",
    borderRadius: "999px",
    padding:      "0 18px",
    fontFamily:   "inherit",
    fontSize:     "14px",
    outline:      "none",
    boxSizing:    "border-box",
    transition:   "border-color .15s, box-shadow .15s",
  }

  return (
    <>
      <PageBackground />
      <div style={{
        position:   "fixed",
        inset:      0,
        display:    "grid",
        placeItems: "center",
        padding:    "20px",
        zIndex:     50,
        fontFamily: "Poppins, system-ui, sans-serif",
        color:      "var(--ink)",
      }}>
        <div style={{
          position:     "relative",
          width:        "min(440px, 100%)",
          background:   "linear-gradient(160deg, var(--card) 40%, #f7e3a6 140%)",
          borderRadius: "32px",
          boxShadow:    "0 30px 60px -25px rgba(74,11,11,.35)",
          padding:      "48px 40px 40px",
          zIndex:       10,
        }}>
          <h1 style={{ fontWeight: 600, fontSize: "24px", margin: "0 0 6px", textAlign: "center" }}>
            Set new password
          </h1>
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", margin: "0 0 28px" }}>
            Choose a strong password for your account.
          </p>

          {done ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#8b1414", fontWeight: 600, marginBottom: "8px" }}>
                Password updated!
              </p>
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Redirecting you to sign in…
              </p>
            </div>
          ) : !ready ? (
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              Verifying your reset link…
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* New password */}
              <div style={{ marginBottom: "12px" }}>
                <label htmlFor="rp-pw" style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "4px", marginLeft: "14px" }}>
                  New password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="rp-pw"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min 8 chars, A-z, 0-9, symbol"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: "46px" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#f5b000"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(245,176,0,.2)" }}
                    onBlur={e =>  { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none" }}
                  />
                  <button type="button" aria-label="Show password" onClick={() => setShowPw(s => !s)}
                    style={{ position: "absolute", right: "6px", bottom: "6px", width: "32px", height: "32px", border: 0, borderRadius: "50%", background: "none", cursor: "pointer", color: "var(--muted)", fontSize: "15px" }}>
                    👁
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="rp-confirm" style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "4px", marginLeft: "14px" }}>
                  Confirm password
                </label>
                <input
                  id="rp-confirm"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = "#f5b000"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(245,176,0,.2)" }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none" }}
                />
              </div>

              {error && (
                <p style={{ fontSize: "12px", color: "#c0261d", marginBottom: "8px", marginLeft: "14px" }}>
                  {error}
                </p>
              )}

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
                  transition:   "background .15s",
                  opacity:      loading ? 0.7 : 1,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ffd75e" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f5b000" }}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
