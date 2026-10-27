"use client"

import { useRouter } from "next/navigation"

export function StudentViewButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push("/user")}
      className="px-5 py-2 rounded-full bg-brand-crimson text-white text-xs font-bold hover:bg-brand-dark transition-colors"
    >
      Student Portal →
    </button>
  )
}
