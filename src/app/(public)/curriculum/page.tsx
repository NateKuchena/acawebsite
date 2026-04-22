import type { Metadata } from 'next'
import Curriculum from '@/components/public/Curriculum'
import Main2 from '@/components/public/Main2'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Curriculum',
  description: 'Learn about the academic curriculum at Amazon Christian Academy, designed to inspire excellence and character formation.',
}

export default function CurriculumPage() {
  return (
    <>
      <Curriculum />
      <Main2 />
    </>
  )
}
