"use client"

interface VisualPanelProps {
  isSignIn: boolean
}

export function VisualPanel({ isSignIn }: VisualPanelProps) {
  return (
    <aside
      className="auth-panel"
      style={{
        position:   "absolute",
        top:        "12px",
        bottom:     "12px",
        left:       "50%",
        width:      "calc(50% - 12px)",
        zIndex:     5,
        borderRadius: "24px",
        overflow:   "hidden",
        color:      "#fff",
        padding:    "36px",
        background: "radial-gradient(120% 90% at 85% 0%, #b32222 0%, #8b1414 40%, #4a0b0b 100%)",
        transform:  isSignIn ? "translateX(-100%)" : "none",
        transition: "transform .8s cubic-bezier(.65,0,.35,1)",
        willChange: "transform",
      }}
    >
      {/* decorative ring */}
      <div style={{
        position: "absolute", width: "340px", height: "340px", borderRadius: "50%",
        right: "-110px", bottom: "-110px",
        border: "44px solid rgba(245,176,0,.25)",
      }} />
      {/* decorative filled circle */}
      <div style={{
        position: "absolute", width: "160px", height: "160px", borderRadius: "50%",
        left: "-50px", top: "46%",
        background: "rgba(245,176,0,.18)",
      }} />

      {/* Copy A — sign-up */}
      <div style={{
        position:   "absolute",
        left:       "36px",
        right:      "36px",
        top:        "36px",
        zIndex:     1,
        opacity:    isSignIn ? 0 : 1,
        transform:  isSignIn ? "translateX(-24px)" : "none",
        transition: "opacity .4s ease, transform .6s cubic-bezier(.65,0,.35,1)",
      }}>
        <span style={{ fontSize: "11px", letterSpacing: ".08em", textTransform: "uppercase", color: "#f5b000", fontWeight: 600 }}>
          Official Enrollment Portal
        </span>
        <h2 style={{ fontSize: "30px", lineHeight: 1.15, margin: "10px 0", fontWeight: 600, maxWidth: "300px" }}>
          Enroll smarter with <span style={{ color: "#f5b000" }}>guided enrollment</span>
        </h2>
        <p style={{ fontSize: "13px", opacity: .85, maxWidth: "290px", margin: 0 }}>
          Auto-assigned subjects, instant answers, and live updates on your application status.
        </p>
      </div>

      {/* Copy B — sign-in */}
      <div style={{
        position:         "absolute",
        left:             "36px",
        right:            "36px",
        top:              "36px",
        zIndex:           1,
        opacity:          isSignIn ? 1 : 0,
        transform:        isSignIn ? "none" : "translateX(24px)",
        transition:       "opacity .4s ease, transform .6s cubic-bezier(.65,0,.35,1)",
        transitionDelay:  isSignIn ? ".3s" : "0s",
      }}>
        <span style={{ fontSize: "11px", letterSpacing: ".08em", textTransform: "uppercase", color: "#f5b000", fontWeight: 600 }}>
          Welcome back, Iskolar
        </span>
        <h2 style={{ fontSize: "30px", lineHeight: 1.15, margin: "10px 0", fontWeight: 600, maxWidth: "300px" }}>
          Pick up where you <span style={{ color: "#f5b000" }}>left off</span>
        </h2>
        <p style={{ fontSize: "13px", opacity: .85, maxWidth: "290px", margin: 0 }}>
          Check your enrollment status, deadlines, and schedule in one place.
        </p>
      </div>

      {/* Chip c3 — avatars */}
      <div style={{
        position:       "absolute",
        right:          "36px",
        top:            "46%",
        zIndex:         2,
        borderRadius:   "18px",
        padding:        "12px 14px",
        fontSize:       "12px",
        background:     "rgba(255,255,255,.14)",
        backdropFilter: "blur(6px)",
        display:        "flex",
        alignItems:     "center",
        gap:            "8px",
        color:          "#fff",
      }}>
        <div style={{ display: "flex" }}>
          {(["#e8b4a0", "#f5b000", "#fff"] as const).map((bg, i) => (
            <div
              key={i}
              style={{
                width:        "24px",
                height:       "24px",
                borderRadius: "50%",
                border:       "2px solid #8b1414",
                marginLeft:   i === 0 ? 0 : "-8px",
                background:   bg,
              }}
            />
          ))}
        </div>
        42+ enrolled in the last hour
      </div>

      {/* Chip c1 — enrollment open */}
      <div style={{
        position:     "absolute",
        left:         "36px",
        bottom:       "150px",
        zIndex:       2,
        borderRadius: "18px",
        padding:      "12px 14px",
        fontSize:     "12px",
        background:   "#f5b000",
        color:        "#3a1a00",
        width:        "230px",
      }}>
        <b style={{ display: "block", fontSize: "13px" }}>Enrollment is Now Open</b>
        Sept 15 – Oct 30, 2026
      </div>

      {/* Chip c2 — key deadline */}
      <div style={{
        position:     "absolute",
        right:        "30px",
        bottom:       "70px",
        zIndex:       2,
        borderRadius: "18px",
        padding:      "12px 14px",
        fontSize:     "12px",
        background:   "var(--card)",
        color:        "var(--ink)",
        width:        "210px",
      }}>
        <b style={{ display: "block", fontSize: "13px", color: "#8b1414" }}>Key Deadline</b>
        Verify curriculum matches before Sep 12, 2026
      </div>
    </aside>
  )
}
