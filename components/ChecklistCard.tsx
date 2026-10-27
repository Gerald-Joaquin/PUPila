import { CheckCircle } from "lucide-react"

interface ChecklistCardProps {
  items:  string[]
  source: string | null
}

export function ChecklistCard({ items, source }: ChecklistCardProps) {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
            <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {source && (
        <p className="text-xs text-indigo-500 pt-1">Source: {source}</p>
      )}
    </div>
  )
}
