'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { carousel1, carousel2, carousel3, carousel4 } from '@/assets'

const slides = [
  { image: carousel1, title: 'Amazon Christian Academy', subtitle: 'Preparing Students for Life Both Globally and Eternally.', buttonText: 'Learn More', buttonLink: '/about' },
  { image: carousel4, title: 'Class of 2025', subtitle: 'Congratulations on your outstanding achievement. The future is yours!', buttonText: 'View More', buttonLink: '/students' },
  { image: carousel2, title: 'Christian Values', subtitle: 'We aim on giving our learners a strong Christian background.', buttonText: 'Learn More', buttonLink: '/curriculum' },
  { image: carousel3, title: 'POTRAZ Letter Writing Competition', subtitle: 'Awarded Best School in Mat-South Letter Writing Competition in 2024 and 2025.', buttonText: 'Learn More', buttonLink: '/campus' },
]

function Coursoul() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min')
  }, [])

  return (
    <div id="carouselExampleAutoplaying" className="carousel slide" data-bs-ride="carousel" data-bs-interval="3500" data-bs-touch="true" data-bs-pause="false">
      <div className="carousel-indicators mb-4">
        {slides.map((_, index) => (
          <button key={index} type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide-to={index} className={index === 0 ? 'active' : ''} aria-current={index === 0 ? 'true' : undefined} aria-label={`Slide ${index + 1}`} />
        ))}
      </div>

      <div className="carousel-inner">
        {slides.map((slide, index) => (
          <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`} style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
            <div className="h-[28rem] sm:h-[32rem] lg:h-[40rem]">
              <div className="w-full h-full bg-black/55">
                <div className="h-full flex items-center justify-center px-4 sm:px-6 lg:px-12">
                  <div className="w-full max-w-[900px] flex flex-col items-center justify-center text-center pt-6 sm:pt-8">
                    <h1 className="text-white font-extrabold leading-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-[300px] sm:max-w-[500px] lg:max-w-[800px]">{slide.title}</h1>
                    <p className="mt-4 sm:mt-5 text-white/95 font-medium text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-[320px] sm:max-w-[560px] lg:max-w-[760px]">{slide.subtitle}</p>
                    <Link href={slide.buttonLink} className="mt-6 sm:mt-8 inline-flex items-center justify-center rounded-2xl bg-indigo-800 hover:bg-indigo-900 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 shadow-lg text-decoration-none transition duration-300">
                      {slide.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  )
}

export default Coursoul
