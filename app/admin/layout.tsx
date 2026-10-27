import { PupilaAdminShell } from "@/components/PupilaAdminShell"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PupilaAdminShell>{children}</PupilaAdminShell>
}