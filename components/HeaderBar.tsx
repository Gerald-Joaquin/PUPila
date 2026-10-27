"use client"

import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { RoleToggle } from "@/components/RoleToggle"

// Hamburger dispatches a custom DOM event that AppShell listens for.
// This avoids prop-drilling through the server layout boundary.
function HamburgerButton() {
  function handleClick() {
    window.dispatchEvent(new Event("open-drawer"))
  }
  return (
    <button
      className="hamburger"
      onClick={handleClick}
      aria-label="Open navigation menu"
      aria-expanded="false"
    >
      {/* Three-bar icon */}
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
        <rect y="0"  width="18" height="2" rx="1" fill="white"/>
        <rect y="6"  width="18" height="2" rx="1" fill="white"/>
        <rect y="12" width="18" height="2" rx="1" fill="white"/>
      </svg>
    </button>
  )
}

export function HeaderBar() {
  return (
    <header
      className="brand-header flex items-center justify-between sticky top-0 z-20 shrink-0"
      style={{
        height:    "56px",
        padding:   "0 20px",
        boxShadow: "0 2px 12px rgba(74,12,12,0.40)",
      }}
    >
      {/* Left: hamburger (mobile/tablet) + logo */}
      <div className="flex items-center" style={{ gap: "10px" }}>
        <HamburgerButton />

        <Link href="/" className="flex items-center gap-2.5 select-none" style={{ textDecoration: "none" }}>
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{
              width:           "32px",
              height:          "32px",
              backgroundColor: "rgba(255,255,255,0.15)",
              border:          "1px solid rgba(255,255,255,0.22)",
            }}
          >
            <GraduationCap size={18} color="#FFFFFF" strokeWidth={1.75} />
          </div>
          <span
            style={{
              color:         "#FFFFFF",
              fontSize:      "16px",
              fontWeight:    800,
              letterSpacing: "0.20em",
              lineHeight:    1,
            }}
          >
            PUPILA
          </span>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center" style={{ gap: "10px" }}>
        <RoleToggle />
        <button
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width:           "32px",
            height:          "32px",
            backgroundColor: "rgba(255,255,255,0.20)",
            border:          "1px solid rgba(255,255,255,0.28)",
          }}
          aria-label="Profile"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
