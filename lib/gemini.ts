/**
 * lib/gemini.ts
 *
 * Server-side Gemini client. Import ONLY from API route handlers.
 * Never import in client components or page files.
 */

import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  Type,
  type Content,
  type GenerateContentConfig,
  type Tool,
  type FunctionDeclaration,
} from "@google/genai"

// ── Configuration ─────────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

const apiKey = process.env.GEMINI_API_KEY

/** true when a real, non-placeholder API key is present */
export const geminiReady =
  typeof apiKey === "string" &&
  apiKey.length > 10 &&
  !apiKey.startsWith("your_") &&
  apiKey !== "placeholder"

// ── Client singleton ──────────────────────────────────────────────────
let _client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: apiKey! })
  }
  return _client
}

// ── Safety settings ───────────────────────────────────────────────────
const SAFETY_SETTINGS: GenerateContentConfig["safetySettings"] = [
  {
    category:  HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category:  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category:  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category:  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// ── Generation config ─────────────────────────────────────────────────
const GENERATION_CONFIG: Partial<GenerateContentConfig> = {
  temperature:     0.3,
  maxOutputTokens: 600,
}

// ── Tool declarations for function calling ────────────────────────────
const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name:        "get_enrollment_status",
    description: "Look up an enrollment record by ENR number. Returns status, student type, year level, program, and subject list. Use this whenever the user asks about their enrollment status or mentions an ENR number.",
    parameters: {
      type:       Type.OBJECT,
      properties: {
        enr_number: {
          type:        Type.STRING,
          description: "The enrollment number in the format ENR-XXXXX-MN-0 or ENR-XXXXX-MN-1",
        },
      },
      required: ["enr_number"],
    },
  },
  {
    name:        "get_subjects",
    description: "Return the list of subjects offered for a specific year level and program. Use this when the user asks what subjects are prescribed for a year level.",
    parameters: {
      type:       Type.OBJECT,
      properties: {
        year_level: {
          type:        Type.STRING,
          description: "The year level, e.g. '1st Year', '2nd Year', '3rd Year', '4th Year'",
        },
        program: {
          type:        Type.STRING,
          description: "The program code, e.g. 'DCPET', 'DECET', 'DIT', 'DOMT', 'DMET', 'DEET'",
        },
      },
      required: ["year_level", "program"],
    },
  },
  {
    name:        "get_schedule",
    description: "Return the class schedule for an enrolled student, identified by their ENR number.",
    parameters: {
      type:       Type.OBJECT,
      properties: {
        enr_number: {
          type:        Type.STRING,
          description: "The enrollment number in the format ENR-XXXXX-MN-0 or ENR-XXXXX-MN-1",
        },
      },
      required: ["enr_number"],
    },
  },
]

export const GEMINI_TOOLS: Tool[] = [
  { functionDeclarations: TOOL_DECLARATIONS },
]

// ── Shared base config builder ────────────────────────────────────────
export function buildConfig(systemInstruction: string): GenerateContentConfig {
  return {
    ...GENERATION_CONFIG,
    systemInstruction,
    safetySettings: SAFETY_SETTINGS,
    tools:          GEMINI_TOOLS,
  }
}

// ── Streaming helper ──────────────────────────────────────────────────
/**
 * Returns a ReadableStream of SSE chunks. Each chunk is a JSON string
 * with one of these shapes:
 *   { type: "chunk", text: string }
 *   { type: "done" }
 *   { type: "error", message: string }
 *
 * The caller is responsible for building the Content[] history.
 */
export async function streamGeminiResponse(
  contents: Content[],
  config:   GenerateContentConfig,
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  function sseChunk(data: object): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const client = getClient()

        // ── Tool-call loop (max 3 rounds) ─────────────────────────────
        let currentContents = [...contents]
        let toolRound = 0
        const MAX_TOOL_ROUNDS = 3

        while (toolRound < MAX_TOOL_ROUNDS) {
          // On the last potential round, disable tools to force a text reply
          const roundConfig: GenerateContentConfig =
            toolRound === MAX_TOOL_ROUNDS - 1
              ? { ...config, tools: undefined }
              : config

          // Non-streaming call for tool-call rounds, streaming for final text
          // We need to check if the model wants to call a tool first
          const probeResponse = await client.models.generateContent({
            model:    GEMINI_MODEL,
            contents: currentContents,
            config:   roundConfig,
          })

          const candidate = probeResponse.candidates?.[0]
          if (!candidate) {
            controller.enqueue(sseChunk({ type: "error", message: "No response from model" }))
            controller.close()
            return
          }

          // Check for function calls in the response
          const functionCalls = candidate.content?.parts?.filter(
            (p) => p.functionCall != null
          )

          if (functionCalls && functionCalls.length > 0) {
            // Execute each tool call
            const functionResponses: Content = {
              role:  "user",
              parts: [],
            }

            for (const part of functionCalls) {
              const fc = part.functionCall!
              const toolName = fc.name ?? ""
              const toolArgs = (fc.args ?? {}) as Record<string, unknown>

              let toolResult: unknown
              try {
                toolResult = await onToolCall(toolName, toolArgs)
              } catch {
                toolResult = { error: "Tool execution failed" }
              }

              functionResponses.parts!.push({
                functionResponse: {
                  name:     toolName,
                  response: { output: toolResult },
                },
              })
            }

            // Append model's tool-call message and our tool results
            currentContents = [
              ...currentContents,
              { role: "model", parts: candidate.content?.parts ?? [] },
              functionResponses,
            ]
            toolRound++
            continue
          }

          // No function calls — stream the final text response
          const streamResponse = await client.models.generateContentStream({
            model:    GEMINI_MODEL,
            contents: currentContents,
            config:   roundConfig,
          })

          for await (const chunk of streamResponse) {
            const text = chunk.text
            if (text) {
              controller.enqueue(sseChunk({ type: "chunk", text }))
            }
          }

          controller.enqueue(sseChunk({ type: "done" }))
          controller.close()
          return
        }

        // Exhausted tool rounds without a text reply — send a fallback
        controller.enqueue(
          sseChunk({ type: "chunk", text: "I was unable to complete your request. Please try again or contact the Enrollment Office." })
        )
        controller.enqueue(sseChunk({ type: "done" }))
        controller.close()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        console.error("[Gemini] stream error:", msg)
        controller.enqueue(sseChunk({ type: "error", message: "I'm having trouble right now. Please try again." }))
        controller.close()
      }
    },
  })

  return stream
}

export { GEMINI_MODEL }
