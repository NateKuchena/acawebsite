function Main1() {
  return (
    <div className="lg:p-5 p-3 d-flex mt-4 mb-5 shadow bg-light flex-column align-items-center" style={{ backgroundColor: 'whitesmoke' }}>
      <div className="d-flex flex-column fw-bolder justify-content-center align-items-center">
        <div className="flex lg:flex-row flex-col items-center justify-center gap-2 w-full lg:p-5 text-center">
          <span className="text-dark mt-3 text-2xl lg:text-5xl">Preparing Students For</span>
          <span className="text-primary text-2xl lg:text-5xl lg:mt-3"> Life Eternally and Globally</span>
        </div>
      </div>
      <hr className="w-full mt-3" />
      <div className="container pb-5 w-full grid grid-cols-1 lg:grid-cols-1 mt-5 relative">
        <div className="bg-cover bg-center lg:p-[3rem] container! lg:w-[1000px]">
          <div className="flex items-center gap-3 justify-start">
            <img src="/assets/noma.jpg" className="shadow rounded-full w-[80px] lg:w-[90px] h-[80px] lg:h-[90px] object-cover" alt="Chairman" />
            <div className="flex flex-col">
              <span className="lg:text-2xl text-xl font-bold">Mrs N Mlangeni</span>
              <span className="text-sm text-grey-500">School Administrator</span>
            </div>
          </div>
          <p className="mt-4 text-justify text-lg">
            Dear Sir/Madam, <br />
            "Welcome to Amazon Christian Academy, where we are dedicated to nurturing young minds and shaping future leaders. At ACA, we believe in fostering an environment that encourages academic excellence, creativity, and holistic development. Our commitment to quality education and student well-being is reflected in our state-of-the-art facilities and our dedicated faculty. We strive to create a learning experience that empowers students to reach their full potential and excel in all aspects of life. I invite you to explore our website and learn more about our vibrant school community. Together, let's work towards a brighter future for every student."
          </p>
        </div>
      </div>
    </div>
  )
}

export default Main1
