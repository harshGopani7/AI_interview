import { NavLink, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { removeToken, getToken } from "../services/token";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const token = getToken();

  return (
    <nav className="navbar navbar-expand-lg sticky-top main-navbar bg-light shadow-sm">
      <div className="container-fluid px-3 px-md-5">
        {/* Logo */}
        <div
          className="navbar-brand logo-container me-5"
          onClick={() => navigate("/")}
          role="button"
        >
          <img 
            src="/oneweblogo.png" 
            alt="InterviewAI Logo" 
            className="img-fluid brand-logo-img" 
            style={{ maxHeight: '50px' }}
          />
        </div>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler custom-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nav Content */}
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 nav-link-gap">
            <li className="nav-item">
              <NavLink to="/" end className="nav-link-custom fw-medium px-3 py-2 rounded-3 text-dark">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/features" className="nav-link-custom fw-medium px-3 py-2 rounded-3 text-dark">
                Features
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/pricing" className="nav-link-custom fw-medium px-3 py-2 rounded-3 text-dark">
                Pricing
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/dashboard" className="nav-link-custom fw-medium px-3 py-2 rounded-3 text-dark">
                Dashboard
              </NavLink>
            </li>
            {/* <li className="nav-item">
              <NavLink to="/contact" className="nav-link-custom fw-medium px-3 py-2 rounded-3 text-dark">
                Contact Us
              </NavLink>
            </li> */}
          </ul>

          {/* Actions */}
          <div className="d-flex align-items-center gap-3 nav-actions p-2 p-lg-0">
            {token ? (
              <Button
                variant="secondary"
                className="btn-sm px-4 py-2 shadow-sm rounded-3"
                onClick={() => {
                  removeToken();
                  navigate("/login");
                }}
              >
                Logout
              </Button>
            ) : (
              <>
                <div 
                  className="login-link text-dark fw-medium px-3 py-2 rounded-3"
                  onClick={() => navigate("/login")}
                  role="button"
                >
                  Login
                </div>
                <Button 
                  className="btn-sm px-4 py-2 shadow-sm rounded-3"
                  onClick={() => navigate("/signup")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}