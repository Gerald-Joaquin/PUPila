"use client"

import { useState } from "react"
import { supabaseBrowser } from "@/lib/supabase-browser"

interface ForgotPasswordModalProps {
  onClose: () => void
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const { error: err } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    /* backdrop */
    <div
      onClick={onClose}
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          100,
        background:      "rgba(0,0,0,.45)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "20px",
        backdropFilter:  "blur(2px)",
      }}
    >
      {/* modal card — stop click bubbling */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:        "min(420px, 100%)",
          background:   "#a21c1b",
          borderRadius: "24px",
          boxShadow:    "0 30px 60px -15px rgba(74,11,11,.4)",
          padding:      "40px 36px 32px",
          position:     "relative",
          fontFamily:   "Poppins, system-ui, sans-serif",
          color:        "#ffffff",
        }}
      >
        {/* close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position:     "absolute",
            top:          "16px",
            right:        "16px",
            width:        "32px",
            height:       "32px",
            borderRadius: "50%",
            border:       0,
            background:   "none",
            cursor:       "pointer",
            color:        "rgba(255,255,255,.7)",
            fontSize:     "18px",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        <h2 style={{ fontWeight: 600, fontSize: "20px", margin: "0 0 6px", textAlign: "center" }}>
          Forgot password?
        </h2>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,.75)", fontSize: "13px", margin: "0 0 24px" }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ fontSize: "14px", color: "#f5b000", fontWeight: 600, marginBottom: "8px" }}>
              Reset link sent!
            </p>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>
              Check your inbox at <strong>{email}</strong> and click the link to set a new password.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop:    "20px",
                width:        "100%",
                height:       "44px",
                border:       0,
                borderRadius: "999px",
                background:   "#f5b000",
                color:        "#3a1a00",
                font:         "600 14px Poppins, sans-serif",
                cursor:       "pointer",
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="fp-email"
                style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,.75)", marginBottom: "4px", marginLeft: "14px" }}
              >
                Email
              </label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                placeholder="juan@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width:        "100%",
                  height:       "44px",
                  border:       "1.5px solid rgba(255,255,255,.2)",
                  background:   "rgba(255,255,255,.12)",
                  color:        "#ffffff",
                  borderRadius: "999px",
                  padding:      "0 18px",
                  fontFamily:   "inherit",
                  fontSize:     "14px",
                  outline:      "none",
                  boxSizing:    "border-box",
                  transition:   "border-color .15s, box-shadow .15s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#f5b000"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(245,176,0,.2)" }}
                onBlur={e =>  { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none" }}
              />
            </div>

            {error && (
              <p style={{ fontSize: "12px", color: "#ffd75e", marginBottom: "8px", marginLeft: "14px" }}>
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
