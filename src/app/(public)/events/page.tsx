import type { Metadata } from 'next'
import Events from '@/components/public/Events'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Events',
  description: 'Stay updated with the latest events, programs, and activities happening at Amazon Christian Academy.',
}

export default function EventsPage() {
  return <Events />
}
