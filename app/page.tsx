import Link from "next/link"
import { StudentViewButton } from "@/components/StudentViewButton"

export default function HomePage() {
  return (
    <div>

      {/* ── Top strip ─────────────────────────────────────────────────── */}
      <div className="flex items-stretch text-[11px] font-bold" style={{ minHeight: 34 }}>
        {/* Gold left section */}
        <div
          className="hidden sm:flex items-center gap-2 px-5 shrink-0"
          style={{ background: "#F5B400", clipPath: "polygon(0 0,100% 0,92% 100%,0 100%)", paddingRight: "3rem" }}
        >
          <span style={{ color: "#6E0A0E" }}>Follow Us</span>
          {/* Facebook */}
          <a href="#" aria-label="Facebook"
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ background: "#9B1B1B" }}>
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
            </svg>
          </a>
          {/* Instagram */}
          <a href="#" aria-label="Instagram"
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ background: "#9B1B1B" }}>
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="17.5" cy="6.5" r="1.2"/>
            </svg>
          </a>
          {/* LinkedIn */}
          <a href="#" aria-label="LinkedIn"
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ background: "#9B1B1B" }}>
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
        </div>
        {/* Crimson right section */}
        <div
          className="flex-1 flex items-center justify-end gap-4 px-6 text-white"
          style={{ background: "#9B1B1B" }}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3 opacity-70 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.24 1.01z"/>
            </svg>
            (02) 8316-7222 / 8330-7300
          </span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="hidden md:flex items-center gap-1.5">
            <svg className="w-3 h-3 opacity-70 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            info@campusassist.edu.ph
          </span>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="PUPila home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="PUPila" className="h-14 w-auto" />
            <span className="leading-tight">
              <span className="block text-2xl font-extrabold tracking-tight">
                <span style={{ color: "#9B1B1B" }}>PUP</span><span style={{ color: "#F5B400" }}>ila</span>
              </span>
              <span className="block text-[10px] font-semibold text-gray-500 mt-[-2px]">Your PUP Enrollment, Made Easier</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-xs font-bold text-gray-700">
            <div className="hidden md:flex gap-6">
              <Link href="/user/enroll" className="text-brand-crimson border-b-2 border-brand-crimson pb-1">Enroll</Link>
              <Link href="/user/chat"   className="hover:text-brand-crimson transition">Ask AI</Link>
              <Link href="/admin"       className="hover:text-brand-crimson transition">Admin</Link>
            </div>
            <StudentViewButton />
          </nav>
        </div>
      </header>

    <section className="relative overflow-hidden bg-gradient-to-br from-white via-neutral-50 to-rose-50">

      {/* Background circle watermark */}
      <div className="absolute -left-16 top-10 w-[480px] h-[390px] opacity-[0.06] pointer-events-none bg-brand-crimson rounded-full" />

      {/* SVG swoosh banner */}
      <svg
        className="absolute bottom-6 left-3 right-0 w-[calc(100%-.75rem)] h-[52%] hidden lg:block drop-shadow-[0_20px_30px_rgba(110,10,14,.25)]"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor="#A10F14" />
            <stop offset="1" stopColor="#6E0A0E" />
          </linearGradient>
          <radialGradient id="h" cx="85%" cy="0%" r="60%">
            <stop offset="0" stopColor="#E23B3B" stopOpacity=".45" />
            <stop offset="1" stopColor="#E23B3B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M0 250 Q0 212 40 200 L980 78 Q1010 74 1040 74 L1440 74 L1440 400 L40 400 Q0 400 0 360 Z" fill="url(#g)" />
        <path d="M0 250 Q0 212 40 200 L980 78 Q1010 74 1040 74 L1440 74 L1440 400 L40 400 Q0 400 0 360 Z" fill="url(#h)" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 md:px-12 pt-12 pb-10 lg:min-h-[740px]">
        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* ── Left: hero text ── */}
          <div className="lg:col-span-6 space-y-5 relative z-10">
            <p className="text-[11px] font-extrabold text-brand-crimson">
              Welcome to CampusAssist AI – Official Online Enrollment Portal
            </p>
            <span className="inline-block px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-[11px] font-extrabold tracking-wider text-amber-800 uppercase">
              BSIT · AY 2025–2026 · 1st Semester
            </span>
            <h1 className="text-4xl md:text-[44px] lg:text-[48px] leading-[1.08] font-extrabold text-brand-navy tracking-tight">
              Enroll smarter with
              <span className="block md:whitespace-nowrap pb-1 bg-gradient-to-r from-brand-crimson via-red-600 to-brand-gold bg-clip-text text-transparent">
                AI-guided enrollment
              </span>
            </h1>
            <p className="text-sm md:text-[15px] text-gray-600 leading-relaxed max-w-md">
              CampusAssist AI helps regular and irregular students navigate the enrollment process — auto-assigns your subjects, answers your questions, and keeps you updated on your status.
            </p>
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <Link
                href="/auth"
                className="enroll-btn px-7 py-3.5 rounded-full text-white text-sm font-extrabold hover:-translate-y-0.5 transition"
                style={{ background: "#9B1B1B", boxShadow: "0 8px 24px rgba(155,27,27,0.35)" }}
              >
                Start Enrollment →
              </Link>
              <Link
                href="/user/chat"
                className="px-6 py-3 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-bold text-gray-700 hover:text-brand-crimson hover:border-brand-crimson transition"
              >
                Ask AI
              </Link>
            </div>
          </div>

          {/* ── Right: photo collage ── */}
          <div className="lg:col-span-6 relative h-[440px] md:h-[480px] z-10">

            {/* Card 1 — large, bottom-left: enrollment stats */}
            <div
              className="absolute left-0 top-16 w-[62%] h-[300px] md:h-[330px] rounded-[1.75rem] overflow-hidden flex flex-col justify-between p-6"
              style={{ background: "linear-gradient(135deg,#9B1B1B 0%,#6E0A0E 100%)", border: "5px solid #fff", boxShadow: "0 24px 48px -16px rgba(80,0,0,0.5)" }}
            >
              {/* Top label */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/60 mb-1">AY 2025–2026</p>
                <p className="text-white font-extrabold text-[22px] leading-tight">Enrollment<br/>Now Open</p>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <p className="text-[28px] font-extrabold text-white leading-none">4</p>
                  <p className="text-[10px] text-white/70 font-semibold mt-0.5">Year Levels</p>
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <p className="text-[28px] font-extrabold text-white leading-none">10</p>
                  <p className="text-[10px] text-white/70 font-semibold mt-0.5">Subjects</p>
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <p className="text-[28px] font-extrabold" style={{ color: "#F5B400" }}>AI</p>
                  <p className="text-[10px] text-white/70 font-semibold mt-0.5">Guided</p>
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <p className="text-[28px] font-extrabold text-white leading-none">24/7</p>
                  <p className="text-[10px] text-white/70 font-semibold mt-0.5">Support</p>
                </div>
              </div>
            </div>

            {/* Card 2 — top-right: quick steps */}
            <div
              className="absolute right-0 top-0 w-[42%] h-[175px] md:h-[195px] rounded-3xl overflow-hidden flex flex-col justify-center px-5 py-4 gap-2.5"
              style={{ background: "#fff8e1", border: "5px solid #fff", boxShadow: "0 24px 48px -16px rgba(80,0,0,0.3)" }}
            >
              <p className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: "#9B1B1B" }}>How it works</p>
              {[
                { n: "1", t: "Sign up" },
                { n: "2", t: "Choose type" },
                { n: "3", t: "Get ENR #" },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0" style={{ background: "#9B1B1B" }}>{s.n}</span>
                  <span className="text-[12px] font-semibold text-gray-700">{s.t}</span>
                </div>
              ))}
            </div>

            {/* Card 3 — mid-right: BSIT badge */}
            <div
              className="absolute right-3 top-[200px] md:top-[220px] w-[38%] h-[190px] md:h-[210px] rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#F5B400 0%,#e6a000 100%)", border: "5px solid #fff", boxShadow: "0 24px 48px -16px rgba(80,0,0,0.3)" }}
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                </svg>
              </div>
              <p className="text-white font-extrabold text-[18px] tracking-tight">BSIT</p>
              <p className="text-white/80 text-[10px] font-semibold text-center px-3">Bachelor of Science in Information Technology</p>
            </div>

            {/* Floating crest badge */}
            <div className="fl absolute left-[38%] top-[60px] z-20 w-28 h-28 rounded-full bg-white border-4 shadow-2xl flex items-center justify-center" style={{ borderColor: "#F5B400" }}>
              <div className="flex flex-col items-center justify-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo.png" alt="PUPila" className="w-12 h-12 object-contain" />
                <span className="text-[8px] font-extrabold uppercase tracking-wider" style={{ color: "#9B1B1B" }}>PUPILA</span>
              </div>
            </div>

            {/* Glass enrollment chip */}
            <div className="absolute left-[28%] bottom-6 z-20 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-bold text-brand-navy bg-white shadow-xl border border-gray-100">
              <span className="flex -space-x-2">
                <span className="w-6 h-6 rounded-full bg-rose-200 border-2 border-white" />
                <span className="w-6 h-6 rounded-full bg-brand-gold border-2 border-white" />
                <span className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
              </span>
              42+ enrolled in the last hour
            </div>
          </div>
        </div>

        {/* ── Info band ── */}
        <div className="mt-10 lg:mt-0 lg:absolute lg:left-14 lg:bottom-14 lg:w-[54%] rounded-3xl bg-gradient-to-r from-brand-crimson to-brand-dark lg:bg-none p-6 lg:p-0 grid sm:grid-cols-2 gap-8 sm:gap-0 relative z-10 text-white">

          {/* Column 1 */}
          <div className="sm:pr-8 flex gap-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-white/10 border border-white/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold leading-tight tracking-tight">Enrollment is Now Open</h3>
              <p className="mt-1.5 text-xs text-white/80 leading-relaxed">
                Apply from <b className="text-brand-gold">July 15 to August 30, 2025</b>. Regular and irregular modules are live.
              </p>
              <Link href="/user/enroll" className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-gold hover:gap-2 transition-all">
                Learn more <span>→</span>
              </Link>
            </div>
          </div>

          {/* Column 2 */}
          <div className="sm:pl-8 sm:border-l sm:border-white/20 flex gap-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-white/10 border border-white/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold leading-tight tracking-tight">AI-Guided Deadlines</h3>
              <p className="mt-1.5 text-xs text-white/80 leading-relaxed">
                Verify your curriculum match before <b className="text-brand-gold">September 12, 2025</b>. Support handles schedule issues online.
              </p>
              <Link href="/user/chat" className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-gold hover:gap-2 transition-all">
                Key deadlines <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  )
}
