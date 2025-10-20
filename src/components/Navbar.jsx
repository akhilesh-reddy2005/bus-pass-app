import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
// FIX: Changed import path to resolve compilation error. 
// Assuming NotificationsBell is accessible via an alias or relative path from the components root.
import NotificationsBell from './NotificationsBell';
import AddToHomeButton from './AddToHomeButton';

function Navbar({ user, userRole, handleLogout, hasApprovedPass, profile }) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) setMenuOpen(false);
  };

  // New reusable button style for mobile links
  const mobileLinkButtonStyle = {
    ...navLinkStyle, 
    width: "100%", 
    height: "auto", 
    padding: "12px 16px",
    display: 'block',
    textAlign: 'left',
    borderRadius: '6px',
    margin: '4px 0',
    textDecoration: 'none',
    boxSizing: 'border-box'
  };

  const studentLinks = (
    <>
      <li>
        <Link to="/home" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Home</Link>
      </li>
      <li>
        <Link to="/epass" style={{ ...mobileLinkButtonStyle, color: "#18193F", background: "#FFD700" }} onClick={handleLinkClick}>My E-Pass</Link>
      </li>
      <li>
        <Link to="/tracking" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Tracking</Link>
      </li>
      {!hasApprovedPass && (
        <li>
          <Link to="/apply" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Apply For E-Pass</Link>
        </li>
      )}
      <li>
        <Link to="/contact" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Contact</Link>
      </li>
    </>
  );

  const adminLinks = (
    <>
      <li>
        <Link to="/admin/requests" style={{ ...mobileLinkButtonStyle, color: "#18193F", background: "#FFD700" }} onClick={handleLinkClick}>Requests</Link>
      </li>
      <li>
        <Link to="/admin/users/students" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Students</Link>
      </li>
      <li>
        <Link to="/admin/users/teachers" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Teachers</Link>
      </li>
      <li>
        <Link to="/admin/complaints" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Complaints</Link>
      </li>
      <li>
        <Link to="/admin/all-data" style={mobileLinkButtonStyle} onClick={handleLinkClick}>See All Data</Link>
      </li>
    </>
  );

  const guestLinks = (
    <>
      <li>
        <Link to="/home" style={mobileLinkButtonStyle} onClick={handleLinkClick}>Home</Link>
      </li>
      <li>
        <Link to="/" style={{ ...mobileLinkButtonStyle, color: "#18193F", background: "#FFD700" }} onClick={handleLinkClick}>Login / Register</Link>
      </li>
    </>
  );

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="CampusBus Logo" style={{ height: "32px", marginRight: "10px", borderRadius: "4px", background: "#fff", padding: "2px" }} />
          <span style={{ fontWeight: "bold", fontSize: 18, color: "#fff", letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            {userRole === "admin" ? "CampusBus Admin" : "CampusBus"}
          </span>
        </div>

        {/* Desktop links */}
        {!isMobile && (
          <ul style={linksRowStyle}>
            {user ? (userRole === "admin" ? adminLinks : studentLinks) : guestLinks}
            {user && <li><button onClick={handleLogout} style={logoutButtonStyle}>Logout</button></li>}
          </ul>
        )}

        {/* Right icons + Notifications + Mobile Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!isMobile && (
            <>
              <span style={iconStyle} title="Twitter"><i className="fab fa-twitter"></i></span>
              <span style={iconStyle} title="Facebook"><i className="fab fa-facebook-f"></i></span>
              <span style={iconStyle} title="Instagram"><i className="fab fa-instagram"></i></span>
            </>
          )}

    

          {isMobile && (
            <button
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: "#FFD700",
                color: "#18193F",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              ☰ Menu
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div ref={menuRef} style={mobileMenuStyle}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {user ? (userRole === "admin" ? adminLinks : studentLinks) : guestLinks}
            {user && (
              <li>
                  <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <button onClick={() => { handleLogout(); handleLinkClick(); }} style={{ ...logoutButtonStyle, width: "100%", height: "auto", padding: "12px 14px", marginTop: "8px" }}>
                      Logout
                    </button>
                    <div style={{ marginTop: 4 }}>
                      <AddToHomeButton profile={profile} onDone={() => { setMenuOpen(false); handleLinkClick(); }} />
                    </div>
                  </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

// Styles
const navStyle = { background: "#18193F", padding: 0, width: "100%", minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(24,25,63,0.08)", position: "fixed", top: 0, left: 0, zIndex: 1000 };
const innerStyle = { width: "100%", maxWidth: 1200, display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 auto", padding: "6px 10px" };
const linksRowStyle = { display: "flex", alignItems: "center", gap: 0, margin: 0, padding: 0, listStyle: "none", height: 56 };
// Updated navLinkStyle properties to ensure they work correctly when spread into mobileLinkButtonStyle
const navLinkStyle = { color: "#fff", padding: "0 20px", height: 56, display: "flex", alignItems: "center", fontWeight: 500, textDecoration: "none", border: "none", fontSize: 16 };
const logoutButtonStyle = { background: "#fff", color: "#18193F", border: "none", padding: "8px 14px", height: 40, display: "flex", alignItems: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", borderRadius: 8 };
const iconStyle = { color: "#fff", marginRight: 8, fontSize: 18, cursor: "pointer" };
const mobileMenuStyle = { position: "absolute", top: 56, left: 0, right: 0, background: "#18193F", borderBottom: "1px solid rgba(255,255,255,0.12)", padding: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 999, maxHeight: "calc(100vh - 60px)", overflowY: "auto" };

export default Navbar;
