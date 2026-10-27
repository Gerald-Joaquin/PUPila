import type { Metadata } from "next"
import "./globals.css"
import { RoleProvider } from "@/components/RoleToggle"

export const metadata: Metadata = {
  title: "PUPila - Enrollment can be easier",
  description: "AI-guided enrollment portal for PUP students",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-gray-800 bg-white overflow-x-hidden antialiased">
        <RoleProvider>
          {children}
        </RoleProvider>
      </body>
    </html>
  )
}
