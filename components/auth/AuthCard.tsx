"use client"

import { useState } from "react"
import { SignUpForm }     from "./SignUpForm"
import { SignInForm }     from "./SignInForm"
import { VisualPanel }    from "./VisualPanel"
import { PageBackground } from "./PageBackground"

const FOOT_LINK: React.CSSProperties = {
  color:              "var(--link)",
  fontWeight:         500,
  textDecoration:     "underline",
  textUnderlineOffset:"2px",
}
const FOOT_BTN: React.CSSProperties = {
  ...FOOT_LINK,
  background: "none",
  border:     0,
  padding:    0,
  font:       "inherit",
  cursor:     "pointer",
}

export function AuthCard() {
  const [isSignIn, setIsSignIn] = useState(false)

  function goSignIn() {
    setIsSignIn(true)
    // focus first field of sign-in after next paint
    requestAnimationFrame(() => {
      document.getElementById("sid2")?.focus({ preventScroll: true })
    })
  }

  function goSignUp() {
    setIsSignIn(false)
    requestAnimationFrame(() => {
      document.getElementById("last")?.focus({ preventScroll: true })
    })
  }

  return (
    /* Full-viewport overlay — escapes the root layout's <main> constraint */
    <div style={{
      position:       "fixed",
      inset:          0,
      background:     "#ffffff",
      display:        "grid",
      placeItems:     "center",
      padding:        "20px",
      zIndex:         50,
      fontFamily:     "Poppins, system-ui, sans-serif",
      color:          "var(--ink)",
      overflowY:      "auto",
    }}>
      <PageBackground />
    <div
      style={{
        position:     "relative",
        width:        "min(1040px, 100%)",
        minHeight:    "660px",
        overflow:     "hidden",
        borderRadius: "32px",
        background:   "linear-gradient(160deg, var(--card) 40%, #f7e3a6 140%)",
        boxShadow:    "0 30px 60px -25px rgba(74,11,11,.35)",
        zIndex:       10,
      }}
      className="dark-shell"
    >
      {/* Sign-up pane (left) */}
      <section
        aria-label="Create an account"
        style={{
          position:      "absolute",
          top:           "12px",
          bottom:        "12px",
          left:          "12px",
          width:         "calc(50% - 12px)",
          padding:       "28px 44px",
          display:       "flex",
          flexDirection: "column",
          opacity:       isSignIn ? 0 : 1,
          visibility:    isSignIn ? "hidden" : "visible",
          transition:    "opacity .45s ease, visibility .45s",
        }}
        className={`auth-pane-up${isSignIn ? " auth-pane-hidden" : ""}`}
      >
        <SignUpForm onGoSignIn={goSignIn} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginTop: "auto" }}>
          <span>
            Have an account?{" "}
            <button type="button" style={FOOT_BTN} onClick={goSignIn}>Sign in</button>
          </span>
          <a href="#" style={FOOT_LINK}>Terms &amp; Conditions</a>
        </div>
      </section>

      {/* Sign-in pane (right) */}
      <section
        aria-label="Sign in"
        style={{
          position:          "absolute",
          top:               "12px",
          bottom:            "12px",
          right:             "12px",
          width:             "calc(50% - 12px)",
          padding:           "28px 44px",
          display:           "flex",
          flexDirection:     "column",
          opacity:           isSignIn ? 1 : 0,
          visibility:        isSignIn ? "visible" : "hidden",
          transition:        "opacity .45s ease, visibility .45s",
          transitionDelay:   isSignIn ? ".3s" : "0s",
        }}
        className={`auth-pane-in${!isSignIn ? " auth-pane-hidden" : ""}`}
      >
        <SignInForm />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginTop: "auto" }}>
          <span>
            New here?{" "}
            <button type="button" style={FOOT_BTN} onClick={goSignUp}>Create an account</button>
          </span>
          <a href="#" style={FOOT_LINK}>Terms &amp; Conditions</a>
        </div>
      </section>

      {/* Sliding visual panel */}
      <VisualPanel isSignIn={isSignIn} />
    </div>
    </div>
  )
}
