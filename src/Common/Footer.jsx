import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import '../styles/Footer.css';
import { IoCallOutline, IoMailOutline } from 'react-icons/io5';


const Footer = () => {
  const currentYear = new Date().getFullYear();
  // add icons before every link from rect-icons library
  return (
    <footer className="footer" id="footer">
      <Container>
        <Row className="footer-top py-4 g-4 align-items-start">
          <Col md={5}>
            <h5 className="footer-heading mb-2">AI4CS</h5>
            <p className="footer-text mb-3">
              Empowering Company Secretaries with AI-driven tools for faster, compliant, and professional outcomes.
            </p>
            <div className="footer-mini">
              <span>Made for professionals • Privacy-first</span>
            </div>
          </Col>
          <Col md={3} lg={3}>
            <h5 className="footer-heading" id="contact">Contact Us</h5>
            <address className="footer-contact">
              <p>
                <a href="tel:+919978062293" aria-label="Call AI4CS">
                  <IoCallOutline />  +91 9978062293
                </a>
              </p>
              <p>
                <a href="mailto:info@ai4cs.in" aria-label="Email AI4CS">
                  <IoMailOutline /> info@ai4cs.in
                </a>
              </p>
            </address>
          </Col>
        </Row>
        <Row className="footer-bottom border-top py-3">
          <Col className="text-center">
            <p className="mb-0 footer-copyright">&copy; {currentYear} AI4CS. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
