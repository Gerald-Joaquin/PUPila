"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarDays, Settings, X } from "lucide-react"

// ── Nav items config ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/",         icon: Home,         label: "Home"     },
  { href: "/track",    icon: CalendarDays, label: "Schedule" },
  { href: "/settings", icon: Settings,     label: "Settings" },
] as const

// ── Sidebar content (shared between desktop sidebar and drawer) ────────
function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {/* Semester badge */}
      <div
        className="rounded-2xl"
        style={{
          margin:          "20px 12px 20px",
          padding:         "12px 16px",
          backgroundColor: "rgba(255,255,255,0.12)",
          border:          "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#F5B301", lineHeight: 1, marginBottom: "4px" }}>
          1ST SEMESTER
        </p>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>
          AY 2025–2026
        </p>
      </div>

      {/* MENU label */}
      <p style={{ padding: "0 16px", marginBottom: "8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.60)" }}>
        MENU
      </p>

      {/* Nav links */}
      <nav className="flex flex-col flex-1" style={{ gap: "2px", padding: "0 8px" }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className="relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group"
              style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 600, backgroundColor: active ? "rgba(255,255,255,0.16)" : "transparent", textDecoration: "none" }}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full" style={{ width: "3px", height: "28px", backgroundColor: "#F5B301" }} />
              )}
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />
              <span className="relative flex items-center justify-center" style={{ width: "20px", height: "20px" }}>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="relative">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ margin: "0 12px 16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <p className="text-center" style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.60)" }}>
          Enrollment Portal
        </p>
      </div>
    </>
  )
}

// ── AppShell ───────────────────────────────────────────────────────────
export function AppShell({
  children,
  header,
}: {
  children: React.ReactNode
  header:   React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname                    = usePathname()
  const drawerRef                   = useRef<HTMLDivElement>(null)

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Escape key closes drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (drawerOpen) setDrawerOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [drawerOpen])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  const openDrawer  = useCallback(() => setDrawerOpen(true),  [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <>
      {/* ── Drawer overlay (mobile/tablet) ── */}
      <div
        className={`drawer-overlay${drawerOpen ? " open" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ── Drawer (mobile/tablet) ── */}
      <div
        ref={drawerRef}
        className={`drawer brand-sidebar${drawerOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <button className="drawer-close" onClick={closeDrawer} aria-label="Close menu">
          <X size={16} />
        </button>
        <SidebarContent onNavClick={closeDrawer} />
      </div>

      {/* ── Page shell ── */}
      <div
        className="antialiased flex flex-col"
        style={{
          fontFamily:      "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
          backgroundColor: "#F4F6FA",
          color:           "#1E2A3A",
          height:          "100dvh",
          overflow:        "hidden",
        }}
      >
        {/* Header — passes the hamburger open callback via clone */}
        {header}

        <div style={{ display: "flex", flex: "1 1 0", minHeight: 0, overflow: "hidden" }}>

          {/* Desktop sidebar */}
          <aside
            className="sidebar-desktop brand-sidebar flex flex-col shrink-0"
            style={{ width: "236px", height: "100%", overflow: "hidden" }}
          >
            <SidebarContent />
          </aside>

          {/* Main scroll area */}
          <main
            className="main-scroll-area"
            style={{
              flex:            "1 1 0",
              minWidth:        0,
              minHeight:       0,
              overflow:        "auto",
              backgroundColor: "#F4F6FA",
            }}
          >
            {children}
          </main>

        </div>

        {/* Bottom tab bar (mobile only) */}
        <nav className="bottom-tab-bar" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`tab-item${pathname === href ? " active" : ""}`}
            >
              <Icon size={22} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>

      </div>

      {/* Expose openDrawer via a custom event so the header button can trigger it */}
      <DrawerBridge open={openDrawer} />
    </>
  )
}

// ── DrawerBridge — lets the header button (a server component sibling)
//    open the drawer by dispatching a custom event ─────────────────────
function DrawerBridge({ open }: { open: () => void }) {
  useEffect(() => {
    function handler() { open() }
    window.addEventListener("open-drawer", handler)
    return () => window.removeEventListener("open-drawer", handler)
  }, [open])
  return null
}
