function Timer() {
  return (
    <div className="mt-3 mb-3 p-3 lg:p-5 text-light bg-gradient-to-br from-indigo-800 to-gray-800">
      <div className="container gap-3 lg:gap-0 flex flex-col lg:flex-row justify-around lg:p-5 p-4 items-center">
        <div className="flex flex-col lg:gap-5 gap-3">
          <span className="text-small lg:text-2xl">Events Date 14 February 2026</span>
          <span className="text-lg hidden lg:block overflow-y-hidden lg:text-4xl lg:w-[400px] w-auto font-bold">
            Amazon Christian Academy <br />
            5 Year Anniversary
          </span>
        </div>
        <div className="flex justify-start items-center">
          <img src="/assets/logo.png" alt="logo" className="w-[300px]" />
        </div>
      </div>
    </div>
  )
}

export default Timer
