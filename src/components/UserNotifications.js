// src/components/UserNotification.js
import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const UserNotification = ({ show, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const popupRef = useRef();

  // Fetch notifications live from Firestore
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (show) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose]);

  // Mark notification as read
  const markAsRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  // Delete notification
  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        top: "70px", // just below navbar
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fff",
        color: "#18193F",
        width: "380px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        zIndex: 1000,
        padding: "16px",
        textAlign: "left",
      }}
    >
      <h4 style={{ margin: "0 0 12px", fontWeight: "600", fontSize: "16px" }}>Notifications</h4>
      {notifications.length === 0 ? (
        <p style={{ fontSize: "14px", color: "#555", textAlign: "center" }}>No notifications yet</p>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              background: notif.read ? "#f8f8f8" : "#ffffff",
              border: "1px solid #eee",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "10px",
              transition: "all 0.2s ease",
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: "500" }}>{notif.title}</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>{notif.message}</p>
            <small style={{ color: "#999", fontSize: "11px" }}>
              {notif.timestamp?.toDate ? new Date(notif.timestamp.toDate()).toLocaleString() : ""}
            </small>

            {/* Action Icons */}
            <div style={{ marginTop: "8px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => markAsRead(notif.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "green",
                  fontSize: "16px",
                }}
                title="Mark as Read"
              >
                ✅
              </button>
              <button
                onClick={() => deleteNotification(notif.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "red",
                  fontSize: "16px",
                }}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserNotification;
