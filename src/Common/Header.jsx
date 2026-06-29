import React, { useContext, useState } from 'react';
import { Navbar, Container, Nav, Button, Offcanvas, Accordion } from 'react-bootstrap';
import { NavLink,Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import '../styles/Chatbot.css';
import { ThemeContext } from './ThemeContext';
import { IoHomeOutline, IoInformationCircleOutline, IoCallOutline, IoSettings, IoChevronDown, IoChevronForward } from 'react-icons/io5';
import { BsFillMoonFill, BsFillSunFill } from 'react-icons/bs';
// import Chatbot from '../components/Chatbot';
import { getToolsByCategoryFromTools, enabledToolIdsFromTools } from '../Tools';

const Header = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  
  const toggleChatbot = () => setIsChatbotOpen(!isChatbotOpen);
  const toolsByCategory = getToolsByCategoryFromTools();
  // console.log(toolsByCategory)
  
  const handleToolClick = (route) => {
    navigate(route);
    setShowToolsMenu(false);
    setShowMenu(false);
  };

  return (
    <Navbar expand="lg" sticky="top" variant={theme === 'dark' ? 'dark' : 'light'} className="header-navbar shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand">
          {/*Add a image logo*/}
          <div className="logo-container">
            <img src="/logo.jpg" alt="Logo" className="logo" />
          </div>
        </Navbar.Brand>
        
        {/* Chatbot Toggle Button - Center */}
        <div className="chatbot-header-toggle d-flex justify-content-center flex-grow-1">
          {/* <Button 
            className="chatbot-toggle-header d-none d-lg-flex"
            onClick={toggleChatbot}
            aria-label="Toggle AI Assistant"
            variant="outline-primary"
          >
            <img src="/images/chatbot.jpg" alt="AI Assistant" className="chatbot-image" />
            <div className="ms-2" style={{ fontWeight: 'bold',fontSize: '18px',alignItems: 'center',display: 'flex' }}>AI Assistant</div>
          </Button> */}
          
          {/* Mobile Chatbot Image Toggle */}
          {/* <Button 
            className="chatbot-toggle-image d-lg-none"
            onClick={toggleChatbot}
            aria-label="Toggle AI Assistant"
          >
            <img 
              src="/images/chatbot.jpg" 
              alt="AI Assistant"
              className="chatbot-image-mobile"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </Button> */}
        </div>
        
        <div className="d-flex align-items-right">
          {/* <Button 
            onClick={toggleTheme} 
            variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} 
            size="sm" 
            className="theme-toggle-btn d-none d-lg-flex align-items-center me-2"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <BsFillSunFill size={16} className="me-1" /> 
                <span className="theme-text">Light</span>
              </>
            ) : (
              <>
                <BsFillMoonFill size={16} className="me-1" /> 
                <span className="theme-text">Dark</span>
              </>
            )}
          </Button> */}
          <Navbar.Toggle 
            aria-controls="main-offcanvas" 
            onClick={() => setShowMenu(true)}
            className="custom-toggler d-lg-none"
          >
            <div className="toggle-icon">
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
            </div>
          </Navbar.Toggle>
        </div>
        <Navbar.Offcanvas
          id="main-offcanvas"
          aria-labelledby="main-offcanvas-label"
          placement="end"
          className="header-offcanvas"
          show={showMenu}
          onHide={() => setShowMenu(false)}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="main-offcanvas-label" className="offcanvas-title">Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="align-items-lg-center ms-lg-auto">
              <Nav.Link as={NavLink} to="/" className="nav-link" onClick={() => setShowMenu(false)}> 
                <IoHomeOutline size={20} className='navbar-buttons'/> Home
              </Nav.Link>
              
              {/* Desktop: Hover Dropdown */}
              {/* <div 
                className="tools-dropdown-container d-none d-lg-block"
                onMouseEnter={() => setShowToolsMenu(true)}
                onMouseLeave={() => setShowToolsMenu(false)}
              >
                <Nav.Link as={Link} to="/tools" className="nav-link tools-nav-link">
                  <IoSettings size={20} className='navbar-buttons'/> Tools <IoChevronDown size={16} className="ms-1" />
                </Nav.Link>
                
                {showToolsMenu && (
                  <div className="tools-mega-dropdown">
                    <div className="tools-mega-content">
                      {Object.entries(toolsByCategory).map(([category, tools]) => (
                        <div key={category} className="tools-category-section">
                          <h6 className="tools-category-title">{category}</h6>
                          <ul className="tools-list">
                            {tools.map(tool => {
                              const IconComponent = tool.icon;
                              const isEnabled = enabledToolIdsFromTools.has(tool.id);
                              return (
                                <li key={tool.id} className={!isEnabled ? 'disabled' : ''}>
                                  <button onClick={() => handleToolClick(tool.route)} className="tool-item">
                                    <IconComponent className="tool-icon-small" />
                                    <span>{tool.title}</span>
                                    {tool.subFeatures && <IoChevronForward size={14} className="ms-auto" />}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div> */}

              {/* Mobile: Accordion */}
              {/* <div className="d-lg-none">
                <Accordion flush>
                  <Accordion.Item eventKey="0" className="tools-accordion-mobile">
                    <Accordion.Header>
                      <IoSettings size={20} className='navbar-buttons me-2'/> Tools
                    </Accordion.Header>
                    <Accordion.Body>
                      {Object.entries(toolsByCategory).map(([category, tools]) => (
                        <div key={category} className="mobile-category-section">
                          <h6 className="mobile-category-title">{category}</h6>
                          {tools.map(tool => {
                            const IconComponent = tool.icon;
                            const isEnabled = enabledToolIdsFromTools.has(tool.id);
                            return (
                              <div key={tool.id} className="mobile-tool-group">
                                <button 
                                  onClick={() => handleToolClick(tool.route)} 
                                  className={`mobile-tool-item ${!isEnabled ? 'disabled' : ''}`}
                                  disabled={!isEnabled}
                                >
                                  <IconComponent size={16} className="me-2" />
                                  <span>{tool.title}</span>
                                </button>
                                {tool.subFeatures && isEnabled && (
                                  <div className="mobile-subfeatures">
                                    {tool.subFeatures.map(sub => (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleToolClick(sub.route)}
                                        className="mobile-subfeature-item"
                                      >
                                        <IoChevronForward size={12} className="me-2" />
                                        {sub.title}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div> */}

              <Nav.Link as={NavLink} to="/about" className="nav-link" onClick={() => setShowMenu(false)}> 
                <IoInformationCircleOutline size={20} className='navbar-buttons'/> About
              </Nav.Link>
              <Nav.Link as={NavLink} to="/contact" className="nav-link" onClick={() => setShowMenu(false)}> 
                <IoCallOutline size={20} className='navbar-buttons'/> Contact Us
              </Nav.Link>
              {/* <Button
                variant="outline-secondary"
                className="theme-toggle ms-lg-3 my-2 d-lg-none d-flex align-items-center"
                onClick={() => {
                  toggleTheme();
                  setShowMenu(false);
                }}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
              >
                {theme === 'dark' ? <><BsFillSunFill size={18} className='theme-buttons'/>  Light</> : <><BsFillMoonFill size={18} className='theme-buttons'/>  Dark</>}
              </Button> */}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
      
      {/* Chatbot Component */}
      {/* <Chatbot isOpen={isChatbotOpen} toggleChatbot={toggleChatbot} /> */}
    </Navbar>
  );
};

export default Header;