'use client'
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import Preloader from './Preloader'
import ScrollToTop from './ScrollToTop'

export default function PublicLayoutClient({ children }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => setLoading(false), 1200)
    }
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  if (loading) return <Preloader />

  return (
    <div className="bg-gray-100 min-h-screen overflow-x-hidden">
      <ScrollToTop />
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
