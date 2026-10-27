"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface EnrollmentNumberRevealProps {
  enrNumber: string
}

export function EnrollmentNumberReveal({ enrNumber }: EnrollmentNumberRevealProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(enrNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl px-6 py-4">
      <span className="text-2xl font-mono font-bold text-indigo-700 tracking-widest">
        {enrNumber}
      </span>
      <button
        onClick={copy}
        className="text-indigo-400 hover:text-indigo-600 transition-colors"
        title="Copy ENR number"
      >
        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
      </button>
    </div>
  )
}
