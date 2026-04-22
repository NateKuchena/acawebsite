import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Portals',
  description: 'Access the Admin, Teacher, or Parent portal for Amazon Christian Academy.',
}

export default function PortalsPage() {
  const portals = [
    {
      title: 'Admin Portal',
      description: 'Full school management: students, staff, finance, assets, and reports.',
      href: '/login',
      color: 'from-indigo-700 to-indigo-900',
      icon: '🏫',
      badge: 'Admin / Staff',
    },
    {
      title: 'Teacher Portal',
      description: 'Enter marks, view the duty roster, submit requisitions, and check the school calendar.',
      href: '/login',
      color: 'from-emerald-600 to-emerald-800',
      icon: '📚',
      badge: 'Teachers',
    },
    {
      title: 'Parent Portal',
      description: 'View your child\'s academic reports, fee statements, and school calendar.',
      href: '/portal-login',
      color: 'from-blue-600 to-blue-800',
      icon: '👨‍👩‍👧',
      badge: 'Parents',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">ACA Portals</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select your portal below to log in. Each portal is tailored to your role in the Amazon Christian Academy community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {portals.map((portal) => (
            <Link
              key={portal.title}
              href={portal.href}
              className="group block rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`bg-gradient-to-br ${portal.color} p-8 text-white`}>
                <div className="text-5xl mb-4">{portal.icon}</div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/20 rounded-full px-3 py-1 mb-3">
                  {portal.badge}
                </span>
                <h2 className="text-2xl font-bold mb-2">{portal.title}</h2>
                <p className="text-white/85 text-sm leading-relaxed">{portal.description}</p>
              </div>
              <div className="bg-white px-8 py-4 flex items-center justify-between">
                <span className="text-gray-700 font-semibold text-sm">Sign In</span>
                <span className="text-gray-400 group-hover:text-gray-700 transition">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium transition">
            ← Back to Main Website
          </Link>
        </div>
      </div>
    </div>
  )
}
