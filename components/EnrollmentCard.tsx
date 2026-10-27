"use client"

import Link from "next/link"
import { CheckCircle, ListChecks } from "lucide-react"

interface EnrollmentCardProps {
  type:        "regular" | "irregular"
  animClass?:  string
}

const CONFIG = {
  regular: {
    href:        "/enroll?type=regular",
    icon:        CheckCircle,
    title:       "Regular Enrollment",
    description: "Auto-assigned subjects · Confirmed instantly",
    tag:         { label: "Instant", bg: "#E6F8EE", color: "#12805C" },
  },
  irregular: {
    href:        "/enroll?type=irregular",
    icon:        ListChecks,
    title:       "Irregular Enrollment",
    description: "Choose your subjects · Pending staff approval",
    tag:         { label: "Needs approval", bg: "#FFF6DB", color: "#8A6100" },
  },
} as const

export function EnrollmentCard({ type, animClass = "" }: EnrollmentCardProps) {
  const cfg  = CONFIG[type]
  const Icon = cfg.icon

  return (
    <Link
      href={cfg.href}
      className={`enroll-card enroll-card-inner ${animClass}`}
      style={{
        display:         "flex",
        flexDirection:   "column",
        backgroundColor: "#FFFFFF",
        borderRadius:    "24px",
        padding:         "32px",
        border:          "1px solid #FBEAEA",
        boxShadow:       "0 10px 30px rgba(139,26,26,0.08)",
        textDecoration:  "none",
      }}
    >
      {/* Icon row + tag */}
      <div
        style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          marginBottom:   "20px",
        }}
      >
        {/* Icon container */}
        <div
          style={{
            width:           "56px",
            height:          "56px",
            borderRadius:    "16px",
            background:      "linear-gradient(135deg, #FBEAEA 0%, #FFF3E0 100%)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            flexShrink:      0,
          }}
        >
          <Icon size={26} color="#8B1A1A" strokeWidth={1.75} />
        </div>

        {/* Status tag */}
        <span
          style={{
            fontSize:        "11px",
            fontWeight:      600,
            color:           cfg.tag.color,
            backgroundColor: cfg.tag.bg,
            borderRadius:    "9999px",
            padding:         "4px 10px",
            whiteSpace:      "nowrap",
          }}
        >
          {cfg.tag.label}
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize:     "22px",
          fontWeight:   700,
          color:        "#1E2A3A",
          margin:       "0 0 10px 0",
          lineHeight:   1.2,
        }}
      >
        {cfg.title}
      </h2>

      {/* Description */}
      <p
        style={{
          fontSize:    "16px",
          color:       "#6B7A8C",
          lineHeight:  1.6,
          margin:      0,
          flex:        1,
        }}
      >
        {cfg.description}
      </p>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid #F0F2F6",
          margin:    "24px 0 20px",
        }}
      />

      {/* CTA */}
      <div className="enroll-card-cta">
        Enroll now
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </div>
    </Link>
  )
}
