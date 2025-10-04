import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Bell } from "lucide-react";

function Navbar({ user, userRole, handleLogout, hasApprovedPass }) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);
  const popupRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user && userRole !== "admin") {
      const q = query(
        collection(db, "notifications"),
        where("userId", "in", ["all", user.uid]),
        orderBy("createdAt", "desc")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
  }, [user, userRole]);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMarkAsRead = (id) => {
    setReadNotifications((prev) => [...prev, id]);
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !readNotifications.includes(n.id)).length;

  const studentLinks = (
    <>
      <li><Link to="/home" style={navLinkStyle}>Home</Link></li>
      <li><Link to="/epass" style={{ ...navLinkStyle, color: "#18193F", background: "#FFD700" }}>My E-Pass</Link></li>
      <li><Link to="/tracking" style={navLinkStyle}>Tracking</Link></li>
      {!hasApprovedPass && <li><Link to="/apply" style={navLinkStyle}>Apply For E-Pass</Link></li>}
      <li><Link to="/contact" style={navLinkStyle}>Contact</Link></li>
    </>
  );

  const adminLinks = (
    <>
      <li><Link to="/admin/requests" style={{ ...navLinkStyle, color: "#18193F", background: "#FFD700" }}>Requests</Link></li>
      <li><Link to="/admin/users/students" style={navLinkStyle}>Students</Link></li>
      <li><Link to="/admin/users/teachers" style={navLinkStyle}>Teachers</Link></li>
      <li><Link to="/admin/logins" style={navLinkStyle}>Login Log</Link></li>
      <li><Link to="/admin/complaints" style={navLinkStyle}>Complaints</Link></li>
      <li><Link to="/admin/all-data" style={navLinkStyle}>See All Data</Link></li>
    </>
  );

  const guestLinks = (
    <>
      <li><Link to="/home" style={navLinkStyle}>Home</Link></li>
      <li><Link to="/" style={{ ...navLinkStyle, color: "#18193F", background: "#FFD700" }}>Login / Register</Link></li>
    </>
  );

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="CampusBus Logo" style={{ height: "32px", marginRight: "10px", borderRadius: "4px", background: "#fff", padding: "2px" }} />
          <span style={{ fontWeight: "bold", fontSize: 18, color: "#fff", letterSpacing: 1 }}>
            {userRole === "admin" ? "CampusBus Admin" : "CampusBus"}
          </span>
        </div>

        {/* Desktop center links */}
        {!isMobile && (
          <ul style={linksRowStyle}>
            {user ? (userRole === "admin" ? adminLinks : studentLinks) : guestLinks}
            {user && (
              <li>
                <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
              </li>
            )}
          </ul>
        )}

        {/* Right side: social + notification bell */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {!isMobile && (
            <>
              <span style={iconStyle} title="Twitter"><i className="fab fa-twitter"></i></span>
              <span style={iconStyle} title="Facebook"><i className="fab fa-facebook-f"></i></span>
              <span style={iconStyle} title="Instagram"><i className="fab fa-instagram"></i></span>
            </>
          )}

          {/* 🔔 Notification bell */}
          {user && userRole !== "admin" && (
            <div ref={popupRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowPopup(!showPopup)}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", position: "relative" }}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span style={badgeStyle}>{unreadCount}</span>
                )}
              </button>

              {showPopup && (
                <div style={popupStyle}>
                  <h4 style={{ margin: "0 0 8px 0" }}>Notifications</h4>
                  {notifications.length > 0 ? (
                    notifications.map((n) => {
                      const isRead = readNotifications.includes(n.id);
                      return (
                        <div key={n.id} style={{ ...notificationCard, opacity: isRead ? 0.6 : 1 }}>
                          <strong>{n.title}</strong>
                          <p style={{ margin: "4px 0" }}>{n.message}</p>
                          <small style={{ color: "#bbb" }}>{formatDateTime(n.createdAt)}</small>
                          <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                            {!isRead && (
                              <button onClick={() => handleMarkAsRead(n.id)} style={markBtn}>Mark Read</button>
                            )}
                            <button onClick={() => handleDelete(n.id)} style={deleteBtn}>Delete</button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: "#aaa", textAlign: "center" }}>No notifications</p>
                  )}
                </div>
              )}
            </div>
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
        <div style={mobileMenuStyle}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {user ? (userRole === "admin" ? adminLinks : studentLinks) : guestLinks}
            {user && (
              <li>
                <button onClick={handleLogout} style={{ ...logoutButtonStyle, width: "100%" }}>Logout</button>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

// 🔔 Styles
const navStyle = {
  background: "#18193F",
  padding: 0,
  width: "100%",
  minHeight: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(24,25,63,0.08)",
  position: "relative",
  zIndex: 1000,
};

const innerStyle = {
  width: "100%",
  maxWidth: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  margin: "0 auto",
  padding: "6px 10px",
};

const linksRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
  height: 56,
};

const navLinkStyle = {
  color: "#fff",
  padding: "0 20px",
  height: 56,
  display: "flex",
  alignItems: "center",
  fontWeight: 500,
  textDecoration: "none",
  border: "none",
  fontSize: 16,
};

const logoutButtonStyle = {
  background: "#fff",
  color: "#18193F",
  border: "none",
  padding: "8px 14px",
  height: 40,
  display: "flex",
  alignItems: "center",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  borderRadius: 8,
};

const iconStyle = { color: "#fff", marginRight: 8, fontSize: 18, cursor: "pointer" };

const mobileMenuStyle = {
  position: "absolute",
  top: 56,
  left: 0,
  right: 0,
  background: "#18193F",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  padding: 8,
};

const popupStyle = {
  position: "absolute",
  top: "36px",
  right: 0,
  background: "#1f1f2e",
  color: "#fff",
  borderRadius: 10,
  width: 320,
  padding: 12,
  zIndex: 2000,
  maxHeight: 400,
  overflowY: "auto",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};

const notificationCard = {
  background: "#2a2a3d",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
};

const badgeStyle = {
  position: "absolute",
  top: "-5px",
  right: "-5px",
  background: "red",
  color: "#fff",
  borderRadius: "50%",
  padding: "2px 6px",
  fontSize: 10,
  fontWeight: "bold",
};

const markBtn = {
  background: "#444",
  color: "#fff",
  border: "none",
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 12,
  cursor: "pointer",
};

const deleteBtn = {
  background: "red",
  color: "#fff",
  border: "none",
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 12,
  cursor: "pointer",
};

export default Navbar;
