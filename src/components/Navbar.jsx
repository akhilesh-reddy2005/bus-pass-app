import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { Bell, CheckCircle2, Trash2 } from "lucide-react"; // ✅ Added icons

function Navbar({ user, userRole, handleLogout, hasApprovedPass }) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 🔔 Fetch notifications
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

  // 🔒 Close popup when clicked outside
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

  // ✅ Mark as read (persistent)
  const handleMarkAsRead = async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  // 🗑️ Delete notification locally
  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      <li><Link to="/admin/notifications" style={navLinkStyle}>Notifications</Link></li>
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
          <img src="/logo.png" alt="CampusBus Logo" style={logoStyle} />
          <span style={logoText}>
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

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* 🔔 Notification Bell */}
          {user && userRole !== "admin" && (
            <div ref={popupRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowPopup(!showPopup)}
                style={bellButton}
              >
                <Bell size={22} />
                {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
              </button>

              {showPopup && (
                <div style={isMobile ? popupMobileStyle : popupStyle}>
                  <h4 style={{ marginBottom: 8, color: "#18193F" }}>Notifications</h4>
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} style={{ ...notificationCard, opacity: n.read ? 0.6 : 1 }}>
                        <strong>{n.title}</strong>
                        <p style={{ margin: "4px 0" }}>{n.message}</p>
                        <small style={{ color: "#555" }}>{formatDateTime(n.createdAt)}</small>
                        <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
  {!n.read && (
    <button
      onClick={() => handleMarkAsRead(n.id)}
      style={markBtn}
      title="Mark as Read"
    >
      <CheckCircle2 size={20} />
    </button>
  )}
  <button
    onClick={() => handleDelete(n.id)}
    style={deleteBtn}
    title="Delete"
  >
    <Trash2 size={20} />
  </button>
</div>

                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#888", textAlign: "center" }}>No notifications</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile menu */}
          {isMobile && (
            <button
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              style={menuBtn}
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

// Styles
const navStyle = { background: "#18193F", padding: 0, width: "100%", minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", top: 0, left: 0, zIndex: 1000 };
const innerStyle = { width: "100%", maxWidth: 1400, display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 auto", padding: "6px 10px" };
const linksRowStyle = { display: "flex", alignItems: "center", gap: 0, margin: 0, padding: 0, listStyle: "none", height: 56, flexWrap: "nowrap" };
const navLinkStyle = { color: "#fff", padding: "0 20px", height: 56, display: "flex", alignItems: "center", fontWeight: 500, textDecoration: "none", border: "none", fontSize: 16 };
const logoutButtonStyle = { background: "#fff", color: "#18193F", border: "none", padding: "8px 14px", height: 40, display: "flex", alignItems: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", borderRadius: 8 };
const bellButton = { background: "none", border: "none", color: "white", cursor: "pointer", position: "relative" };
const badgeStyle = { position: "absolute", top: "-5px", right: "-5px", background: "red", color: "#fff", borderRadius: "50%", padding: "2px 6px", fontSize: 10, fontWeight: "bold" };

// ✅ Popup now white
const popupStyle = { position: "absolute", top: "40px", right: 0, background: "#fff", color: "#18193F", borderRadius: 10, width: "320px", padding: 12, zIndex: 2000, maxHeight: "60vh", overflowY: "auto", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" };
const popupMobileStyle = { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", color: "#18193F", borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 16, zIndex: 3000, maxHeight: "60vh", overflowY: "auto" };

const notificationCard = { background: "#f5f5f5", padding: 10, borderRadius: 8, marginBottom: 10, border: "1px solid #ddd" };
const markBtn = {
  background: "#E8F5E9", // light green background
  color: "#4CAF50",      // green icon
  border: "none",
  padding: "8px",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.2s, box-shadow 0.2s",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};
const deleteBtn = {
  background: "#FFEBEE", // light red background
  color: "#FF5252",      // red icon
  border: "none",
  padding: "8px",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.2s, box-shadow 0.2s",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};

// Hover effect
markBtn[':hover'] = {
  transform: "scale(1.1)",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};
deleteBtn[':hover'] = {
  transform: "scale(1.1)",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};

const menuBtn = { background: "#FFD700", color: "#18193F", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" };
const logoStyle = { height: "32px", marginRight: "10px", borderRadius: "4px", background: "#fff", padding: "2px" };
const logoText = { fontWeight: "bold", fontSize: 18, color: "#fff", letterSpacing: 1 };
const mobileMenuStyle = { position: "absolute", top: 56, left: 0, right: 0, background: "#18193F", borderBottom: "1px solid rgba(255,255,255,0.12)", padding: 8 };

export default Navbar;
