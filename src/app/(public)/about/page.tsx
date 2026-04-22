import type { Metadata } from 'next'
import About from '@/components/public/About'
import Moto from '@/components/public/Moto'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | About Us',
  description: "Discover Amazon Christian Academy's vision, mission, and values. Committed to holistic Christian education.",
}

export default function AboutPage() {
  return (
    <>
      <About />
      <Moto />
    </>
  )
}
