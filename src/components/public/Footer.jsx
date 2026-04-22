import { FaTiktok } from 'react-icons/fa'
import FacebookIcon from '@mui/icons-material/Facebook'

function Footer() {
  return (
    <footer className="text-center text-lg-start text-muted">
      <section className="d-flex justify-content-center justify-content-lg-between p-4 border-bottom">
        <div className="me-5 d-none d-lg-block" />
        <div />
      </section>
      <section>
        <div className="container text-center text-md-start mt-5">
          <div className="row mt-3">
            <div className="col-md-3 col-lg-4 col-xl-3 mx-auto mb-4">
              <h6 className="text-uppercase fw-bold mb-4">Amazon Christian Academy</h6>
              <p>
                Address: <br />
                31, Filabusi <br />
                Matebeleland South, <br />
                Zimbabwe
              </p>
            </div>
            <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4">
              <h6 className="text-uppercase fw-bold mb-4">Contact Us</h6>
              <p>Email: amazonchristianacademy@gmail.com</p>
              <h6 className="text-uppercase fw-bold mb-3 mt-3">Follow Us</h6>
              <div className="d-flex align-items-center gap-3">
                <a href="https://www.tiktok.com/@amazonchristianacademy" target="_blank" rel="noreferrer" className="text-pink-700">
                  <FaTiktok size={20} />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61566837965521" target="_blank" rel="noreferrer" className="text-blue-700">
                  <FacebookIcon fontSize="medium" />
                </a>
              </div>
            </div>
            <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4">
              <h6 className="text-uppercase fw-bold mb-4">Support</h6>
              <div className="flex flex-col gap-3">
                <p>Name: Mr Nathan Kuchena <br /> Phone: +263717788812</p>
                <p>Name: Mrs N Mlangeni <br /> Phone: +263772703804</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="text-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
        © {new Date().getFullYear()} Amazon Christian Academy. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
