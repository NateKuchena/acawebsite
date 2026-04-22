'use client'
import { useMemo, useEffect, useState } from 'react'
import { class2025, arts1, carousel5, athletics5, athletics, athletics1, athletics2, athletics3, athletics4, contact_us, showcase20, teams, showcase3, hivprevention, aleveluniform, chess, showcase17 } from '@/assets'

const galleryItems = [
  { id: 1, image: contact_us, size: 'tall', alt: 'Students group 1' },
  { id: 2, image: arts1, size: 'normal', alt: 'Students group 2' },
  { id: 3, image: teams, size: 'wide', alt: 'Students group 3' },
  { id: 4, image: carousel5, size: 'normal', alt: 'Students group 4' },
  { id: 5, image: aleveluniform, size: 'tall', alt: 'Students group 5' },
  { id: 6, image: athletics1, size: 'wide', alt: 'Students group 6' },
  { id: 7, image: athletics2, size: 'wide', alt: 'Students group 7' },
  { id: 8, image: showcase17, size: 'wide', alt: 'Students group 8' },
  { id: 9, image: athletics3, size: 'normal', alt: 'Students group 9' },
  { id: 10, image: athletics4, size: 'normal', alt: 'Students group 10' },
  { id: 11, image: showcase20, size: 'normal', alt: 'Students group 11' },
  { id: 12, image: athletics, size: 'normal', alt: 'Students group 12' },
  { id: 13, image: chess, size: 'normal', alt: 'Students group 13' },
  { id: 14, image: class2025, size: 'wide', alt: 'Students group 14' },
  { id: 15, image: hivprevention, size: 'normal', alt: 'Students group 15' },
  { id: 16, image: athletics5, size: 'wide', alt: 'Students group 16' },
]

const groupSize = 10

export default function StudentLifeGallery() {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isFading, setIsFading] = useState(false)

  const groups = useMemo(() => {
    const result = []
    for (let i = 0; i < galleryItems.length; i += groupSize) result.push(galleryItems.slice(i, i + groupSize))
    return result
  }, [])

  const closeLightbox = () => setSelectedIndex(null)

  const changeSlide = (newIndex) => {
    setIsFading(true)
    setTimeout(() => { setSelectedIndex(newIndex); setIsFading(false) }, 180)
  }

  const showPrev = () => {
    if (selectedIndex === null) return
    changeSlide(selectedIndex === 0 ? galleryItems.length - 1 : selectedIndex - 1)
  }

  const showNext = () => {
    if (selectedIndex === null) return
    changeSlide(selectedIndex === galleryItems.length - 1 ? 0 : selectedIndex + 1)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') showPrev()
      if (e.key === 'ArrowRight') showNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = selectedIndex !== null ? 'hidden' : 'auto'
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = 'auto' }
  }, [selectedIndex])

  return (
    <section className="student-life-section">
      <h1 className="text-4xl font-bold text-center mb-16 text-indigo-800">Student Life at Amazon Christian Academy</h1>
      <div className="student-life-list">
        {groups.map((group, groupIndex) => (
          <div className="student-life-block" key={groupIndex}>
            <div className="student-life-grid">
              {group.map((item) => {
                const originalIndex = galleryItems.findIndex(g => g.id === item.id)
                return (
                  <button key={item.id} type="button" className={`gallery-card ${item.size}`} onClick={() => setSelectedIndex(originalIndex)} aria-label={`Open ${item.alt}`} title={item.alt}>
                    <img src={item.image} alt={item.alt} loading="lazy" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button type="button" className="lightbox-close" onClick={closeLightbox} aria-label="Close slideshow">×</button>
          <button type="button" className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); showPrev() }} aria-label="Previous image">‹</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={galleryItems[selectedIndex].image} alt={galleryItems[selectedIndex].alt} className={`lightbox-image ${isFading ? 'fade-out' : 'fade-in'}`} />
          </div>
          <button type="button" className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); showNext() }} aria-label="Next image">›</button>
        </div>
      )}
    </section>
  )
}
