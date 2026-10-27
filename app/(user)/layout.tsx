"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Home,
  Calendar,
  Settings,
  GraduationCap,
  User,
} from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { RoleToggle } from "@/components/RoleToggle"
import { ChatBubble } from "@/components/ChatBubble"

const NAV = [
  { label: "Home",     href: "/user",       icon: Home,     exact: true },
  { label: "Schedule", href: "/user/track", icon: Calendar, exact: false },
  { label: "Settings", href: "/settings",   icon: Settings, exact: false },
]

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await supabaseBrowser.auth.signOut()
    router.push("/auth")
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f6fa" }}>

      {/* ── Header ── */}
      <header
        className="h-14 flex items-center justify-between px-5 shrink-0 sticky top-0 z-30"
        style={{ background: "linear-gradient(135deg, #9B1B1B 0%, #6E0A0E 100%)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            <GraduationCap className="w-4 h-4 text-white" />
          </span>
          <span className="font-extrabold tracking-[0.14em] text-[15px] text-white uppercase select-none">
            PUPILA
          </span>
        </div>

        {/* Right: role toggle + LOG OUT + avatar */}
        <div className="flex items-center gap-2.5">
          <RoleToggle />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-1.5 rounded-full border border-white text-white text-xs font-bold tracking-wide hover:bg-white hover:text-[#9B1B1B] transition-colors disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "LOG OUT"}
          </button>
          <span className="w-8 h-8 rounded-full flex items-center justify-center border border-white/30" style={{ background: "rgba(255,255,255,0.15)" }}>
            <User className="w-4 h-4 text-white" />
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <aside
          className="hidden md:flex w-[210px] flex-col shrink-0"
          style={{ background: "linear-gradient(180deg, #9B1B1B 0%, #6E0A0E 100%)" }}
        >
          {/* Semester badge */}
          <div className="mx-3 mt-5 mb-4 rounded-[10px] px-3 py-2.5" style={{ background: "rgba(0,0,0,0.25)" }}>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              1st Semester
            </p>
            <p className="text-[13px] font-bold text-white leading-tight">AY 2025–2026</p>
          </div>

          {/* Menu label */}
          <p className="px-4 pb-2 text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
            Menu
          </p>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {NAV.map(({ label, href, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-colors"
                  style={{
                    color:      active ? "#ffffff" : "rgba(255,255,255,0.55)",
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                      style={{ height: "55%", background: "#F5B400" }}
                    />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 pb-5 pt-3 mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Enrollment Portal</p>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 overflow-auto" style={{ background: "#f5f6fa" }}>
          {children}
        </main>
      </div>

      {/* ── Floating AI chat bubble ── */}
      <ChatBubble />
    </div>
  )
}
