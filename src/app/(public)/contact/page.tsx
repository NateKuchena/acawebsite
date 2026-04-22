import type { Metadata } from 'next'
import Contact from '@/components/public/Contact'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Contact',
  description: 'Get in touch with Amazon Christian Academy. Reach out for inquiries, admissions, and more.',
}

export default function ContactPage() {
  return <Contact />
}
