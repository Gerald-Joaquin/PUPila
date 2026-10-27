import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ enr: string }>
}

// Redirect old /track/[enr] links to the schedule page with the ENR as a query param.
// This prevents a 404 for any bookmarked or linked direct URLs.
export default async function TrackEnrPage({ params }: Props) {
  const { enr } = await params
  redirect(`/user/track?enr=${encodeURIComponent(enr)}`)
}
