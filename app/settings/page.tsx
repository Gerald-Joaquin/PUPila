"use client"

import { useState } from "react"
import { User, Lock, Save, Eye, EyeOff, CheckCircle } from "lucide-react"

// ── Demo profile — in production this would come from auth/session ──────
const DEMO_PROFILE = {
  full_name:   "Alex Rivera",
  student_id:  "2024-10001",
  email:       "alex.rivera@pupila.edu.ph",
  year_level:  "2nd Year",
  program:     "BSIT",
  section:     "BSIT-2A",
}

type Tab = "profile" | "security"

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile")

  // ── Profile form state ─────────────────────────────────────────────
  const [profile, setProfile] = useState({ ...DEMO_PROFILE })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved,  setProfileSaved]  = useState(false)

  // ── Password form state ────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    current:  "",
    next:     "",
    confirm:  "",
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext,    setShowNext]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwErrors,    setPwErrors]    = useState<Record<string, string>>({})
  const [pwSaving,    setPwSaving]    = useState(false)
  const [pwSaved,     setPwSaved]     = useState(false)

  // ── Helpers ────────────────────────────────────────────────────────
  const inp    = "w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none bg-white transition-all placeholder:text-gray-400 text-gray-900 focus:border-[#8B1A1A]/40 focus:ring-2 focus:ring-[#8B1A1A]/[0.08]"
  const inpErr = "w-full border border-red-400 rounded-xl px-4 py-3 text-[14px] outline-none bg-red-50/60 transition-all text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-100"
  const inpRO  = "w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] bg-gray-50 text-gray-400 cursor-not-allowed outline-none"

  // ── Profile save ───────────────────────────────────────────────────
  function validateProfile() {
    const e: Record<string, string> = {}
    if (!profile.full_name.trim()) e.full_name = "Full name is required"
    if (!profile.email.trim())     e.email     = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      e.email = "Enter a valid email address"
    setPwErrors({})
    setProfileErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validateProfile()) return
    setProfileSaving(true)
    // Demo: simulate a 600ms save
    await new Promise(r => setTimeout(r, 600))
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  // ── Password save ──────────────────────────────────────────────────
  function validatePassword() {
    const e: Record<string, string> = {}
    if (!passwords.current.trim())  e.current  = "Current password is required"
    if (passwords.next.length < 8)  e.next     = "Password must be at least 8 characters"
    if (passwords.next !== passwords.confirm) e.confirm = "Passwords do not match"
    setPwErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validatePassword()) return
    setPwSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setPwSaving(false)
    setPwSaved(true)
    setPasswords({ current: "", next: "", confirm: "" })
    setTimeout(() => setPwSaved(false), 3000)
  }

  // ── Password strength ──────────────────────────────────────────────
  function pwStrength(pw: string): { label: string; color: string; pct: number } {
    if (!pw) return { label: "", color: "#E5E9F0", pct: 0 }
    let score = 0
    if (pw.length >= 8)               score++
    if (/[A-Z]/.test(pw))             score++
    if (/[0-9]/.test(pw))             score++
    if (/[^A-Za-z0-9]/.test(pw))      score++
    const map = [
      { label: "Weak",   color: "#EF4444", pct: 25 },
      { label: "Fair",   color: "#F59E0B", pct: 50 },
      { label: "Good",   color: "#10B981", pct: 75 },
      { label: "Strong", color: "#059669", pct: 100 },
    ]
    return map[score - 1] ?? { label: "Weak", color: "#EF4444", pct: 25 }
  }

  const strength = pwStrength(passwords.next)

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col overflow-auto"
      style={{ minHeight: "calc(100vh - 56px)", backgroundColor: "#F4F6FA", padding: "40px 48px" }}
    >
      <div style={{ maxWidth: "720px", width: "100%" }}>

        {/* Page header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1E2A3A", margin: "0 0 6px 0", letterSpacing: "-0.01em" }}>
            Settings
          </h1>
          <p style={{ fontSize: "15px", color: "#6B7A8C", margin: 0 }}>
            Manage your personal information and account security.
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex"
          style={{
            backgroundColor: "#FFFFFF",
            border:          "1px solid #E5E9F0",
            borderRadius:    "14px",
            padding:         "5px",
            marginBottom:    "28px",
            display:         "inline-flex",
            gap:             "4px",
          }}
        >
          {([
            { id: "profile",  Icon: User, label: "Personal Info"  },
            { id: "security", Icon: Lock, label: "Security"       },
          ] as { id: Tab; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[]).map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all duration-200"
              style={
                tab === id
                  ? { backgroundColor: "#8B1A1A", color: "#FFFFFF" }
                  : { backgroundColor: "transparent", color: "#6B7A8C" }
              }
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* ══ PERSONAL INFO TAB ══ */}
        {tab === "profile" && (
          <form onSubmit={handleProfileSave}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border:          "1px solid #E5E9F0",
                borderRadius:    "20px",
                overflow:        "hidden",
              }}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3"
                style={{
                  padding:      "20px 28px",
                  borderBottom: "1px solid #F0F2F6",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: "40px", height: "40px", backgroundColor: "#FBEAEA" }}
                >
                  <User size={20} color="#8B1A1A" strokeWidth={1.75} />
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#1E2A3A", margin: 0 }}>Personal Information</p>
                  <p style={{ fontSize: "12px", color: "#6B7A8C", margin: "2px 0 0" }}>Update your name and contact details.</p>
                </div>

                {/* Avatar circle */}
                <div
                  className="flex items-center justify-center rounded-full font-bold"
                  style={{
                    width:           "48px",
                    height:          "48px",
                    backgroundColor: "#FBEAEA",
                    color:           "#8B1A1A",
                    fontSize:        "18px",
                    marginLeft:      "auto",
                    flexShrink:      0,
                  }}
                >
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Fields */}
              <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Full name */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                    Full Name
                  </label>
                  <input
                    className={profileErrors.full_name ? inpErr : inp}
                    placeholder="Your full name"
                    value={profile.full_name}
                    onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  />
                  {profileErrors.full_name && (
                    <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "5px" }}>{profileErrors.full_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                    Email Address
                  </label>
                  <input
                    className={profileErrors.email ? inpErr : inp}
                    type="email"
                    placeholder="your@email.com"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  />
                  {profileErrors.email && (
                    <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "5px" }}>{profileErrors.email}</p>
                  )}
                </div>

                {/* Read-only row: Student ID + Year Level */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                      Student ID <span style={{ fontSize: "10px", fontWeight: 400, textTransform: "none", color: "#9CA3AF" }}>(fixed)</span>
                    </label>
                    <input className={inpRO} value={profile.student_id} readOnly />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                      Year Level <span style={{ fontSize: "10px", fontWeight: 400, textTransform: "none", color: "#9CA3AF" }}>(fixed)</span>
                    </label>
                    <input className={inpRO} value={profile.year_level} readOnly />
                  </div>
                </div>

                {/* Read-only row: Program + Section */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                      Program <span style={{ fontSize: "10px", fontWeight: 400, textTransform: "none", color: "#9CA3AF" }}>(fixed)</span>
                    </label>
                    <input className={inpRO} value={profile.program} readOnly />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                      Section <span style={{ fontSize: "10px", fontWeight: 400, textTransform: "none", color: "#9CA3AF" }}>(fixed)</span>
                    </label>
                    <input className={inpRO} value={profile.section} readOnly />
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between"
                style={{ padding: "16px 28px", borderTop: "1px solid #F0F2F6", backgroundColor: "#FAFBFC" }}
              >
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                  Fields marked <em>(fixed)</em> are set by the Registrar and cannot be changed here.
                </p>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: "#8B1A1A", minWidth: "120px", justifyContent: "center" }}
                >
                  {profileSaving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  ) : profileSaved ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Save size={15} strokeWidth={2} />
                  )}
                  {profileSaving ? "Saving…" : profileSaved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ══ SECURITY TAB ══ */}
        {tab === "security" && (
          <form onSubmit={handlePasswordSave}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border:          "1px solid #E5E9F0",
                borderRadius:    "20px",
                overflow:        "hidden",
              }}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3"
                style={{ padding: "20px 28px", borderBottom: "1px solid #F0F2F6" }}
              >
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: "40px", height: "40px", backgroundColor: "#FBEAEA" }}
                >
                  <Lock size={20} color="#8B1A1A" strokeWidth={1.75} />
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#1E2A3A", margin: 0 }}>Change Password</p>
                  <p style={{ fontSize: "12px", color: "#6B7A8C", margin: "2px 0 0" }}>Choose a strong password to keep your account safe.</p>
                </div>
              </div>

              {/* Fields */}
              <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Current password */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                    Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className={pwErrors.current ? inpErr : inp}
                      type={showCurrent ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={passwords.current}
                      onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      aria-label={showCurrent ? "Hide password" : "Show password"}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwErrors.current && (
                    <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "5px" }}>{pwErrors.current}</p>
                  )}
                </div>

                {/* New password */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className={pwErrors.next ? inpErr : inp}
                      type={showNext ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={passwords.next}
                      onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNext(v => !v)}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      aria-label={showNext ? "Hide password" : "Show password"}
                    >
                      {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwErrors.next && (
                    <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "5px" }}>{pwErrors.next}</p>
                  )}

                  {/* Strength bar */}
                  {passwords.next && (
                    <div style={{ marginTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Password strength</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: strength.color }}>{strength.label}</span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "9999px", backgroundColor: "#F0F2F6", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${strength.pct}%`,
                            borderRadius: "9999px",
                            backgroundColor: strength.color,
                            transition: "width 300ms ease, background-color 300ms ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7A8C", display: "block", marginBottom: "7px" }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className={pwErrors.confirm ? inpErr : inp}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwErrors.confirm && (
                    <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "5px" }}>{pwErrors.confirm}</p>
                  )}
                  {/* Match indicator */}
                  {passwords.confirm && !pwErrors.confirm && passwords.next === passwords.confirm && (
                    <p className="flex items-center gap-1.5" style={{ fontSize: "12px", color: "#10B981", marginTop: "5px" }}>
                      <CheckCircle size={13} />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Password tips */}
                <div
                  style={{
                    backgroundColor: "#F8F9FC",
                    border:          "1px solid #E5E9F0",
                    borderRadius:    "12px",
                    padding:         "14px 16px",
                  }}
                >
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#1E2A3A", margin: "0 0 8px 0" }}>Tips for a strong password:</p>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {[
                      "At least 8 characters",
                      "Mix uppercase and lowercase letters",
                      "Include at least one number",
                      "Use a special character (e.g. ! @ # $)",
                    ].map(tip => (
                      <li key={tip} style={{ fontSize: "12px", color: "#6B7A8C" }}>{tip}</li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between"
                style={{ padding: "16px 28px", borderTop: "1px solid #F0F2F6", backgroundColor: "#FAFBFC" }}
              >
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                  You will remain logged in after changing your password.
                </p>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: "#8B1A1A", minWidth: "140px", justifyContent: "center" }}
                >
                  {pwSaving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  ) : pwSaved ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Lock size={15} strokeWidth={2} />
                  )}
                  {pwSaving ? "Saving…" : pwSaved ? "Password Changed!" : "Update Password"}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
