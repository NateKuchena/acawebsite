import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Amazon Christian Academy | Parent Portal',
  description: 'Access the Parent Portal for Amazon Christian Academy.',
}

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-20 px-4">
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">Parent Portal</h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            View your child&apos;s academic reports, fee statements, and school calendar.
          </p>
        </div>

        <Link
          href="/portal-login"
          className="group block rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-white text-center">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/20 rounded-full px-3 py-1 mb-4">
              Parents
            </span>
            <h2 className="text-2xl font-bold">Sign In</h2>
          </div>
          <div className="bg-white px-8 py-4 flex items-center justify-between">
            <span className="text-gray-700 font-semibold text-sm">Access Portal</span>
            <span className="text-gray-400 group-hover:text-gray-700 transition">→</span>
          </div>
        </Link>

        <div className="text-center mt-10">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium transition">
            ← Back to Main Website
          </Link>
        </div>
      </div>
    </div>
  )
}
