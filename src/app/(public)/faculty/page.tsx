import type { Metadata } from 'next'
import Faculty from '@/components/public/Faculty'
import Main2 from '@/components/public/Main2'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Faculty',
  description: 'Meet our dedicated faculty at Amazon Christian Academy. Our educators are committed to holistic development and academic excellence.',
}

export default function FacultyPage() {
  return (
    <>
      <Faculty />
      <Main2 />
    </>
  )
}
