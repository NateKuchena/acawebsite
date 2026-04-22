import type { Metadata } from 'next'
import StudentLifeGallery from '@/components/public/StudentLifeGallery'
import Students from '@/components/public/Students'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Students',
  description: 'Explore resources and updates for students at Amazon Christian Academy. Empowering learners for life.',
}

export default function StudentsPage() {
  return (
    <>
      <StudentLifeGallery />
      <Students />
    </>
  )
}
