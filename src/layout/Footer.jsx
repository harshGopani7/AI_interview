import { Link } from "react-router-dom";
import "./Footer.css";
import { HiOutlineMail, HiOutlinePhone } from "react-icons/hi";
import { FaTwitter, FaLinkedinIn, FaGithub } from "react-icons/fa";
import { IoLogoInstagram, IoLogoLinkedin } from "react-icons/io5";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="row gy-7">
          {/* Column 1: Brand & Contact */}
          <div className="col-lg-3 col-md-12">
            <div className="footer-brand mb-4">
              <img src="/oneweblogo.png" alt="InterviewAI Logo" className="footer-logo-img" />
            </div>
            <p className="footer-tagline">
              Onewebmart is a one-stop solution for all the IT needs of any business. We offer services to ensure the growth of your business with an increase in the customer base to large extent.
            </p>
            {/* <div className="footer-contact mt-4">
              <a href="mailto:support@interviewai.com" className="contact-link">
                <HiOutlineMail className="contact-icon" /> support@interviewai.com
              </a>
              <a href="tel:+1234567890" className="contact-link">
                <HiOutlinePhone className="contact-icon" /> +1 (555) 123-4567
              </a>
            </div> */}
            <div className="footer-mini">
              {/* Instagram Link */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <a style={{ color: 'white' }} href="https://www.instagram.com/onewebmart/" target="_blank" rel="noopener noreferrer">
                  <IoLogoInstagram />
                </a>
                <a style={{ color: 'white' }} href="https://www.linkedin.com/company/onewebmart-solution/" target="_blank" rel="noopener noreferrer">
                  <IoLogoLinkedin />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Product Links */}
          <div className="col-6 col-lg-2">
            <h5 className="footer-heading">Company</h5>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Company Links */}
          <div className="col-6 col-lg-4">
            <h5 className="footer-heading">Services</h5>
            <ul className="footer-links">
              <li><Link to="/">ERP Software Company</Link></li>
              <li><Link to="/">AI Integration & Deployment </Link></li>
              <li><Link to="/">AI Strategy & Consulting </Link></li>
              <li><Link to="/">AI Agents </Link></li>              
              <li><Link to="/">Custom software development company</Link></li>
              <li><Link to="/">Mobile App Development</Link></li>
              <li><Link to="/">IT Consulting</Link></li>
              <li><Link to="/">E-commerce Application</Link></li>
              <li><Link to="/">CMS Website Development</Link></li>
              <li><Link to="/">Cloud Computing</Link></li>
              <li><Link to="/">Custom software development company</Link></li>
            </ul>
          </div>

          {/* Column 4: Social & Legal */}
          <div className="col-lg-2 col-md-12">
            <h5 className="text-uppercase mb-3">Get In Touch</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="mailto:business@onewebmart.com" className="text-decoration-none text-white">
                  business@onewebmart.com
                </a>
              </li>
              <li className="mb-2">
                <a href="tel:+919033806717" className="text-decoration-none text-white">
                  +91 9033806717
                </a>
              </li>
              <li>
                <a href="tel:+919408307302" className="text-decoration-none text-white">
                  +91 9408307302
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0 copyright-text text-white">
                &copy; {currentYear} Onewebmart Solution. All rights reserved.
              </p>
            </div>
            <div className="col-md-6">
              <ul className="footer-legal-links justify-content-center justify-content-md-end mb-0 text-white">
                <li ><Link to="/privacy" className="text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}