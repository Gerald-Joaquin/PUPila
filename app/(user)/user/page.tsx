import Link from "next/link"

export default function UserHomePage() {
  return (
    <div className="px-10 py-10 overflow-y-auto">

        {/* Heading */}
        <h1 className="text-[34px] font-extrabold tracking-tight leading-tight text-gray-900 mb-2">
          Start your{" "}
          <span style={{ color: "#9B1B1B" }}>enrollment</span>
        </h1>
        <p className="text-[14px] text-gray-400 mb-8 max-w-md leading-relaxed">
          Choose your enrollment type to begin. You can track your status anytime with your{" "}
          <span className="font-bold" style={{ color: "#9B1B1B" }}>ENR number</span>.
        </p>

        {/* Enrollment cards */}
        <div className="flex gap-5 flex-wrap mb-8">

          {/* Regular Enrollment */}
          <div
            className="flex-1 min-w-[240px] max-w-[320px] bg-white rounded-2xl shadow-sm p-6"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-bold text-gray-900">Regular Enrollment</h2>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#dcfce7", color: "#15803d" }}>
                Instant
              </span>
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
              Auto-assigned subjects&nbsp;·&nbsp;Confirmed instantly
            </p>
            {/* Primary CTA — chat wizard */}
            <Link
              href="/user?action=enroll"
              className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white mb-2 hover:bg-[#7a1515] active:scale-[0.98] transition-all"
              style={{ background: "#9B1B1B" }}
            >
              Enroll via Chat
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </Link>
            {/* Secondary CTA — form */}
            <Link
              href="/user/enroll?type=regular"
              className="block text-center text-[11px] text-gray-400 hover:text-[#9B1B1B] transition-colors"
            >
              Use the form instead
            </Link>
          </div>

          {/* Irregular Enrollment */}
          <div
            className="flex-1 min-w-[240px] max-w-[320px] bg-white rounded-2xl shadow-sm p-6"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-bold text-gray-900">Irregular Enrollment</h2>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#fef9c3", color: "#854d0e" }}>
                Needs approval
              </span>
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
              Choose your subjects&nbsp;·&nbsp;Pending staff approval
            </p>
            {/* Primary CTA — chat wizard */}
            <Link
              href="/user?action=enroll"
              className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white mb-2 hover:bg-[#7a1515] active:scale-[0.98] transition-all"
              style={{ background: "#9B1B1B" }}
            >
              Enroll via Chat
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </Link>
            {/* Secondary CTA — form */}
            <Link
              href="/user/enroll?type=irregular"
              className="block text-center text-[11px] text-gray-400 hover:text-[#9B1B1B] transition-colors"
            >
              Use the form instead
            </Link>
          </div>
        </div>

        {/* Quick-link chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/user/track"
            className="px-4 py-2 rounded-full bg-white text-[13px] font-medium text-gray-600 hover:text-[#9B1B1B] transition-colors"
            style={{ border: "1px solid #e5e7eb" }}
          >
            Track enrollment
          </Link>
        </div>
    </div>
  )
}
