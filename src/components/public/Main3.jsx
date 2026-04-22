'use client'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'
import Link from 'next/link'
import { showcase11 } from '@/assets'

function Main3() {
  return (
    <div className="parallax-container">
      <div
        className="parallax-bg inset-0 bg-black/50 bg-blend-overlay d-flex justify-content-center align-items-center bg-center bg-no-repeat object-contain"
        style={{ backgroundImage: `url(${showcase11})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', width: '100%' }}
      />
      <div className="container-fluid bg-dark position-absolute text-light d-flex justify-content-center align-items-center h-100 w-100 bg-opacity-25 overflow-x-hidden">
        <div className="container">
          <div className="w-100 h-100 grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h1 className="fw-bold text-2xl lg:text-4xl overflow-y-hidden mb-4">Amazon Christian Academy</h1>
              <p className="text-lg lg:text-2xl">
                Amazon Christian Academy offers a rich and diverse educational experience that goes beyond the classroom. Our campus is designed to support a wide range of activities and interests, ensuring that every student has the opportunity to explore and excel.
              </p>
              <span>
                <Link href="/students" className="btn shadow-lg mt-5 fw-bold rounded-0 btn-primary">
                  Go Explore <ArrowRightAltIcon />
                </Link>
              </span>
            </div>
            <div className="hidden lg:flex justify-center">
              <img src="/assets/logo.png" alt="" className="shadow-lg object-contain rounded-4 h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Main3
