import type { AIResponse } from "@/types"
import kb from "@/lib/kb.json"

interface KBEntry {
  id:       string
  title:    string
  type:     "info" | "checklist" | "unknown"
  keywords: string[]
  content:  string
  items?:   string[]
}

const entries = kb as KBEntry[]

const FALLBACK: AIResponse = {
  answer: "I don't have information about that. Please contact the Registrar's Office directly.",
  source: null,
  type:   "unknown",
  items:  null
}

// Simple greeting detector for the keyword-only fallback path
const GREETING_RE = /^\s*(hi+|hello+|hey+|good\s+(morning|afternoon|evening|day)|kumusta|kamusta|musta|sup|howdy|yo|hola|greetings|magandang\s+(umaga|hapon|gabi))[!.,\s]*$/i

export function getAIResponse(message: string): AIResponse {
  if (!message || message.trim().length === 0) return FALLBACK

  // Greet back warmly before doing any KB lookup
  if (GREETING_RE.test(message.trim())) {
    return {
      answer: "Hi there! 👋 I'm CampusAssist AI, your enrollment assistant. How can I help you today? Feel free to ask about enrollment, subjects, or your ENR status.",
      source: null,
      type:   "info",
      items:  null,
    }
  }

  // Normalize: lowercase and collapse punctuation to spaces so phrases match
  const normalized = message.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()

  // Score each entry by how many of its keywords match as whole words in the normalized message
  let bestEntry: KBEntry | null = null
  let bestScore = 0

  for (const entry of entries) {
    const score = entry.keywords.filter(kw => {
      // Escape special regex chars in multi-word keywords, then match as whole word(s)
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(normalized)
    }).length
    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  }

  if (!bestEntry || bestScore === 0) return FALLBACK

  return {
    answer: bestEntry.content,
    source: bestEntry.title,
    type:   bestEntry.type,
    items:  bestEntry.items ?? null
  }
}
