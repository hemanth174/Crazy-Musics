/*
================================================================================
  LANDING PAGE
================================================================================
  The beautiful landing page with hero section, features, and footer.
================================================================================
*/

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Handle launch app / start music buttons
  const handleLaunchApp = () => {
    navigate('/register');
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Close mobile menu when clicking a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="landing-page">
      {/* Particles Background */}
      <div id="particles-container"></div>
      
      <div className="Container">
        {/* NAVBAR */}
        <nav className="NavBar">
          <div className="Navele">
            <img src="/APPlogo.png" alt="Crazy-Musics Logo" />
            <h1>Crazy-Musics</h1>
          </div>
          <div className="NavButton">
            <div className="nav-toggle" onClick={toggleMobileMenu}>
              <img 
                width="28" 
                height="28" 
                src="https://img.icons8.com/fluency-systems-filled/48/FFFFFF/menu.png" 
                alt="menu" 
              />
            </div>
            
            {/* Desktop Menu */}
            <div className="Navlinks">
              <a href="#FirstPage1"><p>Home</p></a>
              <a href="#secondpage1"><p>Features</p></a>
              <a href="#contactPage1"><p>Contact</p></a>
            </div>
            <div className="button2">
              <button onClick={handleLaunchApp}>Launch APP</button>
            </div>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="CloseTbn">
            <p className="close-mobile" onClick={closeMobileMenu}>
              <img 
                width="38" 
                height="38" 
                src="https://img.icons8.com/quill/100/FFFFFF/multiply-2.png" 
                alt="close" 
              />
            </p>
          </div>
          <a href="#FirstPage1" onClick={closeMobileMenu}><p>Home</p></a>
          <a href="#secondpage1" onClick={closeMobileMenu}><p>Features</p></a>
          <a href="#contactPage1" onClick={closeMobileMenu}><p>Contact</p></a>
          <Link to="/login" onClick={closeMobileMenu}><p>Login</p></Link>
          <Link to="/register" onClick={closeMobileMenu}><p>Sign Up</p></Link>
        </div>
        
        {/* HERO SECTION */}
        <div id="FirstPage1" className="FirstPage">
          <div className="IMG1">
            <div className="headings">
              <h1>UNLEASH THE MADNESS</h1>
              <br />
              <p className="para">Stream Cosmic Chaos, Synth-Frekout & Beyond</p>
              <button className="button1" onClick={handleLaunchApp}>
                Start Music
              </button>
            </div>
          </div>
        </div>
        
        {/* FEATURES SECTION */}
        <div id="secondpage1" className="SecondPage">
          <div className="IMG2">
            <div className="cards">
              <h1>Experience The Madness</h1>
              <div className="card-row">
                <div className="card1">
                  <img src="/Card1.png" alt="AI Playlist" />
                </div>
                <div className="card2">
                  <img src="/Card2.png" alt="Radio" />
                </div>
                <div className="card3">
                  <img src="/Card3.png" alt="Share" />
                </div>
              </div>
            </div>
            <div className="cards5">
              <div className="Secondpagefooter">
                <button onClick={handleLaunchApp}>START YOUR JOURNEY</button>
              </div>
              <div className="Page3">
                <p>Privacy Policy</p>
                <p>Terms of Services</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* FOOTER / CONTACT SECTION */}
        <div id="contactPage1" className="footerPage">
          <div className="IMG3">
            <div className="Heading3">
              <h1>Feel the Beat. Stay in Touch.</h1>
            </div>
            <div className="Logo">
              <img src="/APPlogo.png" alt="Logo" />
            </div>
            <div className="FotterCards">
              <div className="FotterCards1">
                <h2 className="Fotterheading">EXPLORE</h2>
                <div className="Headings1">
                  <div className="Column1">
                    <p style={{ cursor: 'pointer' }}>Home</p>
                    <p style={{ cursor: 'pointer' }}>Features</p>
                    <p style={{ cursor: 'pointer' }}>Artists</p>
                    <p style={{ cursor: 'pointer' }}>Blog</p>
                  </div>
                  <div className="Column2">
                    <p style={{ cursor: 'pointer' }}>About Us</p>
                    <p style={{ cursor: 'pointer' }}>Careers</p>
                    <p style={{ cursor: 'pointer' }}>Help Center</p>
                    <p style={{ cursor: 'pointer' }} onClick={() => navigate('/register')}>Sign Up</p>
                  </div>
                </div>
              </div>
              <div className="FotterCards2">
                <h4 className="Fotterheading1">UNLEASH THE MADNESS</h4>
                <h5>Stream Cosmic Chaos, Synth-Frekout & Beyond</h5>
              </div>
              <div className="FotterCards3">
                <h4 className="Fotterheading">CONNECT WITH US</h4>
                <div className="Icons">
                  <img 
                    width="94" 
                    height="94" 
                    src="https://img.icons8.com/3d-fluency/188/facebook-logo.png" 
                    alt="facebook" 
                  />
                  <img 
                    width="94" 
                    height="94" 
                    src="https://img.icons8.com/3d-fluency/94/twitter-circled--v1.png" 
                    alt="twitter" 
                  />
                  <img 
                    width="94" 
                    height="94" 
                    src="https://img.icons8.com/3d-fluency/94/instagram-new.png" 
                    alt="instagram" 
                  />
                  <img 
                    className="snapchat" 
                    width="94" 
                    height="94" 
                    src="https://img.icons8.com/3d-fluency/94/snapchat-squared.png" 
                    alt="snapchat" 
                  />
                </div>
              </div>
            </div>
            <div className="Ptag">
              <p className="copyright">© 2024. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
