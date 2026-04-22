import type { Metadata } from 'next'
import Coursoul from '@/components/public/Coursoul'
import Marquee from '@/components/public/Marquee'
import Timer from '@/components/public/Timer'
import AboutPrograms from '@/components/public/AboutPrograms'
import Main1 from '@/components/public/Main1'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Home',
  description: 'Welcome to Amazon Christian Academy, Home of the Lions. Preparing students for life both globally and eternally.',
}

export default function Home() {
  return (
    <>
      <Coursoul />
      <Marquee text={'"Welcome to Amazon Christian Academy, Home Of The Lions."'} />
      <Timer />
      <Marquee text={'"Join us in celebrating our 5 year anniversary!"'} />
      <AboutPrograms />
      <Main1 />
    </>
  )
}
