import type { EnrollmentStatus } from "@/types"

interface StatusTimelineProps {
  status:      EnrollmentStatus
  studentType: "regular" | "irregular"
}

const REGULAR_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "confirmed", label: "Confirmed" },
]

const IRREGULAR_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "pending",   label: "Pending Review" },
  { key: "terminal",  label: "Decision" },
]

function getActiveStep(status: EnrollmentStatus, studentType: "regular" | "irregular"): number {
  if (studentType === "regular") {
    return status === "confirmed" ? 1 : 0
  }
  if (status === "pending")   return 1
  if (status === "confirmed" || status === "rejected") return 2
  return 0
}

export function StatusTimeline({ status, studentType }: StatusTimelineProps) {
  const steps       = studentType === "regular" ? REGULAR_STEPS : IRREGULAR_STEPS
  const activeIndex = getActiveStep(status, studentType)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isDone    = i < activeIndex
          const isCurrent = i === activeIndex
          const isLast    = i === steps.length - 1

          let label = step.label
          if (step.key === "terminal") {
            if (status === "confirmed") label = "✅ Confirmed"
            else if (status === "rejected") label = "❌ Rejected"
            else label = "Awaiting Decision"
          }

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    isDone
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : isCurrent
                      ? status === "rejected"
                        ? "bg-red-100 border-red-400 text-red-600"
                        : "bg-indigo-100 border-indigo-400 text-indigo-600"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-1.5 text-xs text-center whitespace-nowrap ${
                    isCurrent
                      ? status === "rejected"
                        ? "text-red-600 font-semibold"
                        : "text-indigo-600 font-semibold"
                      : isDone
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mb-6 transition-colors ${
                    isDone ? "bg-indigo-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Status badge */}
      <div className="flex justify-center pt-2">
        <span
          className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
            status === "confirmed"
              ? "bg-green-100 text-green-700"
              : status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {status === "confirmed" ? "Confirmed" : status === "rejected" ? "Rejected" : "Pending Approval"}
        </span>
      </div>
    </div>
  )
}
