"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase-browser"
import {
  LayoutDashboard,
  Inbox,
  BarChart2,
  Menu,
  X,
  MessageCircle,
  User,
} from "lucide-react"
import { RoleToggle } from "@/components/RoleToggle"
import { ChatWindow } from "@/components/ChatWindow"

interface PupilaAdminShellProps {
  children: React.ReactNode
}

export function PupilaAdminShell({ children }: PupilaAdminShellProps) {
  const pathname      = usePathname()
  const router        = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiOpen,      setAiOpen]      = useState(true)
  const [loggingOut,  setLoggingOut]  = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await supabaseBrowser.auth.signOut()
    router.push("/auth")
  }

  const showAiPanel = pathname === "/admin" || pathname.startsWith("/admin/requests")

  const navItems = [
    { label: "Home",     href: "/admin",           icon: LayoutDashboard, exact: true  },
    { label: "Requests", href: "/admin/requests",  icon: Inbox,           exact: false },
    { label: "Reports",  href: "/admin/reports",   icon: BarChart2,       exact: false },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f6fa" }}>

      {/* ── Top header ──────────────────────────────────────────────── */}
      <header
        className="h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30"
        style={{ background: "#7a1515" }}
      >
        {/* Left: hamburger (mobile) + brand */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-white/60 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center">
            <Image
              src="/img/logo.png"
              alt="PUPILA logo"
              width={44}
              height={44}
              className="shrink-0"
            />
          </div>
        </div>

        {/* Right: role toggle + logout + AI panel toggle + avatar */}
        <div className="flex items-center gap-2.5">
          <RoleToggle />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-1.5 rounded-full border border-white text-white text-xs font-bold tracking-wide hover:bg-white hover:text-[#7a1515] transition-colors disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "LOG OUT"}
          </button>
          {showAiPanel && (
            <button
              className="hidden xl:flex items-center justify-center w-8 h-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setAiOpen(o => !o)}
              aria-label="Toggle AI assistant"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 border border-white/20"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <User className="w-4 h-4" />
          </span>
        </div>
      </header>

      {/* ── Body row ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside
          className={[
            "fixed top-16 bottom-0 left-0 z-20 w-[210px] flex flex-col",
            "transition-transform duration-200 ease-in-out",
            "md:translate-x-0 md:static md:top-auto md:bottom-auto md:z-auto md:flex md:shrink-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
          style={{ background: "#7a1515" }}
        >
          {/* Semester badge */}
          <div className="px-4 pt-5 pb-3">
            <div
              className="rounded-[10px] px-3 py-2.5"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              <p className="text-[10px] font-semibold tracking-[0.1em] text-white/60 uppercase mb-0.5">
                1st Semester
              </p>
              <p className="text-[13px] font-semibold text-white leading-tight">
                AY 2025–2026
              </p>
            </div>
          </div>

          {/* Nav label */}
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.1em] text-white/40 uppercase">
            Menu
          </p>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {navItems.map(({ label, href, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors relative"
                  style={{
                    color:      active ? "#ffffff" : "rgba(255,255,255,0.55)",
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  }}
                >
                  {/* active left bar */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                      style={{ height: "60%", background: "#f5b400" }}
                    />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {label}
                </Link>
              )
            })}

          </nav>

          {/* Footer */}
          <div
            className="px-4 pb-4 pt-3 mt-auto"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Enrollment Portal
            </p>
          </div>
        </aside>

        {/* ── Content area ────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "#f5f6fa" }}>
          <div className="px-6 py-8 md:px-10 md:py-10">
            {children}
          </div>
        </main>

        {/* ── AI panel ─────────────────────────────────────────────── */}
        {showAiPanel && aiOpen && (
          <aside
            className="hidden xl:flex flex-col w-[320px] shrink-0"
            style={{ background: "#ffffff", borderLeft: "1px solid #e5e7eb" }}
          >
            {/* Panel header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <span
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: "#971b1f" }}
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 leading-tight">AI Assistant</p>
                <p className="text-xs text-gray-400 truncate">Powered by CampusAssist</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#1f8a5b] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1f8a5b]" />
                Online
              </span>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow />
            </div>

            {/* Disclaimer */}
            <p
              className="text-center text-xs text-gray-400 px-4 py-3"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              Answers from curated enrollment content only
            </p>
          </aside>
        )}
      </div>
    </div>
  )
}
