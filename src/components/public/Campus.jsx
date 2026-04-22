'use client'
import { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { Cancel } from '@mui/icons-material'
import { coverpage, showcase, showcase1, showcase2, showcase3, showcase4, showcase5, showcase6, showcase7, showcase8, showcase9, showcase10, showcase11, showcase12, showcase13, showcase14, showcase15, showcase16, showcase17, showcase18, showcase19, showcase20, arts1 } from '@/assets'

const campusImages = [coverpage, showcase, showcase1, arts1, showcase2, showcase3, showcase4, showcase5, showcase6, showcase7, showcase8, showcase9, showcase10, showcase11, showcase12, showcase13, showcase14, showcase15, showcase16, showcase17, showcase18, showcase19, showcase20]

const Campus = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    Modal.setAppElement('body')
  }, [])

  const openImageModal = (imageUrl, index) => {
    setSelectedImage(imageUrl)
    setCurrentImageIndex(index)
  }

  const closeImageModal = () => setSelectedImage(null)

  const nextImage = () => {
    const next = (currentImageIndex + 1) % campusImages.length
    setCurrentImageIndex(next)
    setSelectedImage(campusImages[next])
  }

  const prevImage = () => {
    const prev = (currentImageIndex - 1 + campusImages.length) % campusImages.length
    setCurrentImageIndex(prev)
    setSelectedImage(campusImages[prev])
  }

  return (
    <div className="bg-gray-100 py-16">
      <div className="container mx-auto text-center px-4">
        <section>
          <h2 className="text-3xl lg:text-5xl font-bold mb-8 text-indigo-700">Campus Showcase</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {campusImages.map((imageUrl, index) => (
              <div key={index} className="relative overflow-hidden bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-300" onClick={() => openImageModal(imageUrl, index)}>
                <img src={imageUrl} alt={`Campus Image ${index + 1}`} className="w-full h-40 object-cover object-center" />
                <div className="absolute inset-0 bg-black opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white font-semibold">Click to enlarge</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 mt-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-8 text-indigo-700">Campus Video Showcase</h2>
          <p>Coming Soon...</p>
        </section>

        <Modal
          isOpen={!!selectedImage}
          onRequestClose={closeImageModal}
          contentLabel="Enlarged Image"
          className="modal flex flex-col items-center bg-dark bg-opacity-25 rounded-lg justify-center"
          overlayClassName="overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative">
              <img src={selectedImage} alt="Enlarged Campus Image" className="max-h-full lg:w-[1000px] lg:h-[600px] w-[400px] h-[300px] object-cover rounded-xl shadow-lg" />
              <Cancel onClick={closeImageModal} className="absolute top-4 right-4 cursor-pointer text-white text-3xl bg-gray-700 bg-opacity-75 rounded-full p-1" style={{ fontSize: '2rem' }} />
              <button onClick={prevImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2">&#10094;</button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2">&#10095;</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default Campus
