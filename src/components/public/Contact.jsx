'use client'
import { useRef } from 'react'
import emailjs from '@emailjs/browser'
import { useRouter } from 'next/navigation'
import { AccessTime, LocationOn, GetApp } from '@mui/icons-material'
import { contact_us } from '@/assets'

function Contact() {
  const form = useRef()
  const router = useRouter()

  const sendEmail = async (e) => {
    e.preventDefault()
    try {
      await emailjs.sendForm('service_jdydgdx', 'template_isq55fy', form.current, 'jrIGv6A_SlTCeYJXj')
      alert('Message sent successfully!')
      router.push('/')
    } catch (error) {
      console.error(error)
      alert('Failed to send message. Please try again.')
    }
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="relative h-[90vh] bg-cover bg-center" style={{ backgroundImage: `url(${contact_us})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-5 lg:mt-0 lg:mb-0 mb-5">
            <form ref={form} onSubmit={sendEmail} className="bg-white bg-opacity-95 max-w-full sm:max-w-lg md:max-w-xl mx-auto p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xl transform hover:scale-105 transition duration-300">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 sm:mb-8 text-center text-blue-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">Contact Us</h2>
              <input type="text" name="name" placeholder="Your Name" className="w-full p-3 sm:p-4 mb-4 sm:mb-5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 text-sm sm:text-base" />
              <input type="email" name="email" placeholder="Your Email Address" className="w-full p-3 sm:p-4 mb-4 sm:mb-5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 text-sm sm:text-base" required />
              <textarea name="message" placeholder="Your Message" className="w-full p-3 sm:p-4 mb-4 sm:mb-5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 text-sm sm:text-base" rows={4} required />
              <button type="submit" className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-teal-500 transition duration-300 text-base sm:text-lg font-semibold transform hover:scale-105">Send Message</button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-20 px-6">
        <h2 className="text-5xl font-extrabold mb-16 text-center text-blue-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">Get In Touch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="p-8 bg-white shadow-xl rounded-3xl hover:shadow-2xl transition duration-300 transform hover:scale-105 text-center">
            <AccessTime className="text-5xl text-blue-500 mb-6 mx-auto" style={{ fontSize: '3rem' }} />
            <h3 className="text-2xl font-semibold mb-4 text-center text-blue-800">Office Hours</h3>
            <p className="text-gray-600 text-center">Monday - Friday: 8:00 AM - 4:00 PM</p>
            <p className="text-gray-600 text-center">Saturday: 10:00 AM - 2:00 PM</p>
            <p className="text-gray-600 text-center">Sunday: Closed</p>
          </div>
          <div className="p-8 bg-white shadow-xl rounded-3xl hover:shadow-2xl transition duration-300 transform hover:scale-105 text-center">
            <LocationOn className="text-5xl text-blue-500 mb-6 mx-auto" style={{ fontSize: '3rem' }} />
            <h3 className="text-2xl font-semibold mb-4 text-center text-blue-800">Visit Us</h3>
            <p className="text-gray-600 text-center">31 Filabusi, Zimbabwe</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-5xl font-extrabold text-center mb-16 text-blue-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">Admission Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-white shadow-xl rounded-3xl hover:shadow-2xl transition duration-300 transform hover:scale-105">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">Admission Process</h3>
              <p className="text-gray-600 mb-6">Admission forms are available for download. Submit the completed form along with required documents at the school office.</p>
              <a href="https://i.pinimg.com/474x/88/6c/72/886c729c5e6310e29e269031d73a5625.jpg" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-full hover:from-blue-600 hover:to-teal-500 transition duration-300 transform hover:scale-105">
                <GetApp className="mr-2" /> Download Admission Form
              </a>
            </div>
            <div className="p-8 bg-white shadow-xl rounded-3xl hover:shadow-2xl transition duration-300 transform hover:scale-105">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">Criteria</h3>
              <p className="text-gray-600">Admission is based on merit and availability of seats. Entrance tests may be conducted for certain forms.</p>
            </div>
            <div className="p-8 bg-white shadow-xl rounded-3xl hover:shadow-2xl transition duration-300 transform hover:scale-105">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">Important Dates</h3>
              <ul className="text-gray-600 space-y-2">
                <li>Admission Form Availability: November 1st</li>
                <li>Last Date for Submission: December 31st</li>
                <li>Entrance Test: December 5th</li>
                <li>Announcement of Results: January 2nd</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-20 px-6">
        <h2 className="text-5xl font-extrabold text-center mb-16 text-blue-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">Find Us On The Map</h2>
        <div className="rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition duration-300">
          <iframe title="Google Maps" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3737.989490168762!2d29.2068211682312!3d-20.465624840853863!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ecaef004bb360cb%3A0xc869834bfb4b7321!2sAmazon%20Christian%20Academy%3A%20Church%20of%20Christ!5e0!3m2!1sen!2szm!4v1757587067864!5m2!1sen!2szm" frameBorder="0" className="w-full h-[500px] border-0" allowFullScreen loading="lazy" />
        </div>
      </div>
    </div>
  )
}

export default Contact
