function Preloader() {
  return (
    <div className="preloader">
      <div className="preloader__overlay">
        <div className="preloader__content">
          <div className="preloader__logo-wrapper">
            <img src="/assets/lion.png" alt="Amazon Christian Academy Logo" className="preloader__logo" />
            <div className="preloader__ring" />
          </div>
          <h1 className="preloader__title">Amazon Christian Academy</h1>
          <p className="preloader__subtitle">Preparing Students for Life Both Globally and Eternally</p>
          <div className="preloader__dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Preloader
