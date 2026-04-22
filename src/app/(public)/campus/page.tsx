import type { Metadata } from 'next'
import Campus from '@/components/public/Campus'
import Main3 from '@/components/public/Main3'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Campus',
  description: 'Discover our beautiful campus and facilities that provide a conducive environment for learning and growth.',
}

export default function CampusPage() {
  return (
    <>
      <Campus />
      <Main3 />
    </>
  )
}
